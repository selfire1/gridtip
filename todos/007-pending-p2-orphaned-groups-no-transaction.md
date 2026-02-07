---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, data-integrity, transaction, database]
dependencies: []
---

# Orphaned Groups Created When Membership Insertion Fails

## Problem Statement

The `createGroup` function creates a group record first, then adds the member. If membership insertion fails, the group remains in the database with no members - an orphaned, inaccessible record.

### Why This Matters

- **Orphaned Records**: Groups exist but cannot be accessed or deleted
- **Data Cleanup**: Manual intervention required to remove orphaned groups
- **User Confusion**: User thinks creation failed, but group actually exists
- **Duplicate Groups**: User retries, creating multiple groups with same name
- **Admin Can't Access**: Admin user has no membership, can't see or manage group

## Findings

**Location**: `actions/create-group.ts:11-63`

### Current Implementation

```typescript
export async function createGroup(data: CreateGroupData) {
  const { user } = await verifySession()

  // ... validation ...

  // Step 1: Create group - SUCCESS
  const [createdGroup] = await db
    .insert(groupsTable)
    .values({
      name: data.name,
      iconName: data.icon,
      adminUser: user.id,
      cutoffInMinutes: data.cutoff,
    })
    .returning()

  group = createdGroup

  // Step 2: Set cookie
  await setGroupCookie(group.id)

  // Step 3: Add membership - FAILURE
  try {
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: user.id,
      userName: data.userName,
    })
  } catch (error) {
    // Group still exists! No rollback!
    return {
      ok: false as const,
      message: 'Could not join created group',
    }
  }

  return { ok: true as const, group }
}
```

### Failure Scenario

```typescript
// User creates "F1 Champions League"
// 1. Insert into groups -> SUCCESS (id: "clx123")
// 2. setGroupCookie("clx123") -> SUCCESS
// 3. Insert into group_members -> FAILURE
//    (Database lock, constraint violation, network error, etc.)

// DATABASE STATE:
// ✓ groups: id="clx123", name="F1 Champions League", admin_user="user123"
// ✗ group_members: (no rows for this group)

// PROBLEMS:
// 1. User sees error: "Could not join created group"
// 2. User thinks creation failed
// 3. Group exists but is inaccessible
// 4. User tries again -> creates another orphaned group
// 5. Admin user can't see/manage this group (no membership)
// 6. Group cannot be deleted (user has no access)
// 7. Cookie is set to nonexistent membership
```

### When This Can Happen

1. **Database Lock**: Another transaction is holding a lock
2. **Constraint Violation**: Missing userName (see Issue #002)
3. **Network Error**: Connection drops between the two INSERTs
4. **Resource Limits**: Database out of connections/space
5. **Race Condition**: Duplicate membership check passes but insert fails

## Proposed Solutions

### Solution 1: Database Transaction (Recommended)

**Pros**:
- Atomic operation (all or nothing)
- Standard database pattern
- No orphaned records possible
- Clean error handling

**Cons**:
- Slightly more complex code
- Need to ensure all operations are inside transaction

**Effort**: Small (1-2 hours)
**Risk**: Low

**Implementation**:

```typescript
export async function createGroup(data: CreateGroupData) {
  const { user } = await verifySession()

  const result = CreateGroupSchema.safeParse(data)
  if (!result.success) {
    return {
      ok: false as const,
      error: z.prettifyError(result.error),
      message: 'Invalid data',
    }
  }

  try {
    // Wrap in transaction - all or nothing
    const group = await db.transaction(async (tx) => {
      // Step 1: Create group
      const [createdGroup] = await tx
        .insert(groupsTable)
        .values({
          name: data.name,
          iconName: data.icon,
          adminUser: user.id,
          cutoffInMinutes: data.cutoff,
        })
        .returning()

      // Step 2: Add membership
      // If this fails, Step 1 is automatically rolled back
      await tx.insert(groupMembersTable).values({
        groupId: createdGroup.id,
        userId: user.id,
        userName: data.userName,
      })

      return createdGroup
    })

    // Only set cookie AFTER successful transaction
    await setGroupCookie(group.id)

    return { ok: true as const, group }
  } catch (error) {
    console.error('Group creation failed:', error)
    return {
      ok: false as const,
      error: (error as Error)?.message,
      message: 'Could not create group',
    }
  }
}
```

### Solution 2: Compensating Transaction

**Pros**:
- More explicit error handling
- Can log specific failure point

**Cons**:
- More complex code
- Manual cleanup required
- Risk of cleanup also failing

**Effort**: Medium (3-4 hours)
**Risk**: Medium

```typescript
export async function createGroup(data: CreateGroupData) {
  let createdGroup: Group | null = null

  try {
    // Step 1: Create group
    const [group] = await db.insert(groupsTable).values({...}).returning()
    createdGroup = group

    // Step 2: Add membership
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: user.id,
      userName: data.userName,
    })

    await setGroupCookie(group.id)
    return { ok: true, group }
  } catch (error) {
    // Cleanup: Delete group if it was created
    if (createdGroup) {
      try {
        await db.delete(groupsTable).where(eq(groupsTable.id, createdGroup.id))
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned group:', cleanupError)
      }
    }
    return { ok: false, message: 'Could not create group' }
  }
}
```

**Not recommended**: Transaction is cleaner and more reliable.

## Recommended Action

**Implement Solution 1**: Wrap group creation and membership insertion in a database transaction.

This is the standard approach and guarantees atomicity.

## Technical Details

### Affected Files
- `/Users/joschuag/Developer/Public/gridtip/actions/create-group.ts` (entire function)

### Database Tables
- `groups` (group record)
- `group_members` (membership record)

### Drizzle Transaction API

```typescript
await db.transaction(async (tx) => {
  // All operations use tx instead of db
  await tx.insert(...)
  await tx.update(...)

  // If any operation throws, entire transaction rolls back
})
```

## Acceptance Criteria

- [ ] `createGroup` function wrapped in database transaction
- [ ] Group and membership created atomically
- [ ] Cookie only set after successful transaction
- [ ] If transaction fails, no records are created
- [ ] Error handling updated for transaction failures
- [ ] Integration test: Simulate membership insert failure, verify no group created
- [ ] Integration test: Successful creation creates both records
- [ ] Verify no orphaned groups exist in production (cleanup if needed)

## Work Log

### 2026-02-07
- **Discovered**: Data Integrity Guardian identified orphaned record risk
- **Analyzed**: Current implementation has two separate INSERT operations
- **Confirmed**: No transaction boundary, second INSERT can fail independently
- **Assessed**: P2 - Important data integrity issue

## Resources

- [Drizzle Transactions](https://orm.drizzle.team/docs/transactions)
- [Current implementation](/Users/joschuag/Developer/Public/gridtip/actions/create-group.ts)
