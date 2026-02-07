---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, code-quality, refactoring, type-safety]
dependencies: []
---

# Code Quality Improvements - Type Safety and Clarity

## Problem Statement

Several non-critical code quality issues that reduce maintainability, type safety, and code clarity throughout the onboarding flow.

### Why This Matters

- **Maintainability**: Future developers may struggle to understand code
- **Type Safety**: TypeScript not fully leveraged
- **Debugging**: Harder to trace issues
- **Best Practices**: Deviates from conventions

## Findings

### Issue 1: Missing Explicit Return Types

**Location**: `profile-screen.tsx:130-161`

```typescript
function createProps(
  groupKey: keyof Pick<OnboardingState, ...>
) {  // ← No return type
  return {
    name: state[groupKey]?.name ?? '',
    // ...
  }
}
```

**Impact**: Low - TypeScript infers correctly, but explicit types improve readability.

**Fix**:
```typescript
function createProps(
  groupKey: keyof Pick<OnboardingState, ...>
): {
  name: string
  image: string | undefined
  onNameChange: (name: string) => void
  onImageChange: (preview: string | undefined, file: File | undefined) => void
} {
  return { /* ... */ }
}
```

---

### Issue 2: Function Name Shadowing

**Location**: `actions/join-group.ts:68`

```typescript
export async function joinGroup(data: JoinGroupData) {
  // ...

  function joinGroup({  // ← Shadows outer function!
    userId,
    groupId,
    userName,
  }: {...}) {
    return db.insert(groupMembersTable).values({...})
  }
}
```

**Impact**: Low - Confusing, but works. Could cause issues if refactored.

**Fix**:
```typescript
function insertGroupMembership({
  userId,
  groupId,
  userName,
}: {...}) {
  return db.insert(groupMembersTable).values({...})
}
```

---

### Issue 3: Unsafe Type Assertion with @ts-expect-error

**Location**: `profile-screen.tsx:80-81`

```typescript
return {
  name: 'Global Leaderboard',
  // @ts-expect-error special icon
  iconName: 'lucide:globe',
  id: 'global',
} satisfies JoinGroupData
```

**Impact**: Low - Works but bypasses type system.

**Fix**: Add 'lucide:globe' to SUPPORTED_ICON_NAMES or create separate type.

---

### Issue 4: Unnecessary Database Updates

**Location**: `complete-onboarding.tsx:191-198`

```typescript
await db
  .update(userTable)
  .set({
    profileImageUrl: imageResult.data?.ufsUrl || undefined,
    name: input.name || undefined,
    hasSeenOnboarding: true,
  })
  .where(eq(userTable.id, userId))
```

**Impact**: Low - UPDATE runs even if only setting hasSeenOnboarding.

**Fix**: Check if there's meaningful data to update:
```typescript
const updates: Partial<User> = {
  hasSeenOnboarding: true,
}

if (imageResult.data?.ufsUrl) {
  updates.profileImageUrl = imageResult.data.ufsUrl
}

if (input.name) {
  updates.name = input.name
}

await db.update(userTable).set(updates).where(eq(userTable.id, userId))
```

---

### Issue 5: Missing Null Checks in Data Flow

**Location**: `onboarding-context.tsx:136-148`

```typescript
function getInput() {
  if (action === 'create') {
    return {
      action: 'create' as const,
      profileData: state.profileCreateGroupData,
      groupData: state.createGroupScreenData,  // Could be undefined!
    }
  }
}
```

**Impact**: Low - Would fail at validation, but unclear.

**Fix**: Add validation:
```typescript
if (!state.createGroupScreenData) {
  throw new Error('Missing group data')
}
```

---

### Issue 6: Generic Error Messages

**Location**: `join-group.ts:62-66`

```typescript
} catch (error) {
  return {
    ok: false as const,
    message: (error as Error)?.message,  // Could be technical jargon
  }
}
```

**Impact**: Low - Users see raw error messages.

**Fix**: Map known errors to user-friendly messages:
```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'

  if (message.includes('FOREIGN KEY')) {
    return { ok: false, message: 'Group no longer exists' }
  }

  if (message.includes('UNIQUE constraint')) {
    return { ok: false, message: 'Already a member' }
  }

  return { ok: false, message: 'Failed to join group' }
}
```

---

### Issue 7: Inconsistent Error Logging

Some actions log errors, others don't:

```typescript
// Some places:
console.error('Upload failed:', error)

// Other places:
console.log('no input')  // Should be error level

// Other places:
// No logging at all
```

**Fix**: Consistent error logging with structured format:
```typescript
import { logger } from '@/lib/logger'

logger.error('Upload failed', { error, userId, fileSize })
```

## Proposed Solutions

### Solution 1: Incremental Improvements (Recommended)

**Pros**:
- Low risk
- Can be done over time
- Each fix is independent

**Cons**:
- Takes multiple PRs

**Effort**: Small per issue (30 min - 1 hour each)
**Risk**: Very Low

**Priority Order**:
1. Fix function name shadowing (most confusing)
2. Add explicit return types (improves readability)
3. Improve error messages (better UX)
4. Add null checks (prevents runtime errors)
5. Fix type assertions (better type safety)
6. Optimize database updates (minor performance)
7. Standardize error logging (better debugging)

### Solution 2: Complete Refactor

**Pros**:
- All issues fixed at once
- Opportunity to improve architecture

**Cons**:
- High risk
- Large PR
- Could introduce bugs

**Effort**: Large (1-2 days)
**Risk**: High

**Not recommended**: P3 issues don't justify large refactor.

## Recommended Action

**Implement Solution 1**: Fix issues incrementally as time permits.

Start with highest-impact items (function shadowing, error messages).

## Technical Details

### Affected Files
- `app/(onboarding)/tipping/onboarding/_lib/onboarding-context.tsx`
- `app/(onboarding)/tipping/onboarding/_components/screens/profile-screen.tsx`
- `actions/join-group.ts`
- `actions/complete-onboarding.tsx`

### No Breaking Changes

All fixes are internal improvements, no API changes.

## Acceptance Criteria

- [ ] Function name shadowing resolved
- [ ] Return types added to complex functions
- [ ] Type assertions removed or justified
- [ ] Error messages user-friendly
- [ ] Null checks added where needed
- [ ] Consistent error logging
- [ ] Database updates optimized

## Work Log

### 2026-02-07
- **Discovered**: Various review agents identified code quality issues
- **Categorized**: Grouped related improvements
- **Assessed**: P3 - Nice-to-have, not urgent
- **Prioritized**: Fix incrementally when touching related code

## Resources

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Error Handling Best Practices](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
