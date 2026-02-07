---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, data-model, confusion, naming]
dependencies: []
---

# Inconsistent Profile Image Field Naming Across Schema

## Problem Statement

Profile images are stored using three different field names across the database schema, creating confusion and potential for data loss or incorrect image selection.

### Why This Matters

- **Data Loss Risk**: Wrong field referenced, image lost
- **Code Confusion**: Developers unsure which field to use
- **Maintenance Burden**: Changes require updating multiple locations
- **Logic Complexity**: Fallback chains obscure intent

## Findings

### Three Different Field Names

**1. `user.profileImageUrl`** - Canonical user profile image
**2. `user.image`** - OAuth provider image
**3. `groupMember.profileImage`** - Group-specific profile

### Confusing Fallback Logic

**Onboarding Context**:
```typescript
imagePreview: user.profileImageUrl || user.image || undefined
```

**Profile Update**:
```typescript
const profileImage = profile.useDefaultImage
  ? user.profileImageUrl  // Only checks one field!
  : imageResult.data?.ufsUrl
```

## Proposed Solutions

### Solution 1: Standardize on Single Source (Recommended)

**Effort**: Medium (4-6 hours)
**Risk**: Low

Migrate OAuth images to `profileImageUrl`, deprecate `user.image`.

### Solution 2: Create Helper Function

**Effort**: Small (2-3 hours)
**Risk**: Low

Encapsulate fallback logic in utility function.

## Recommended Action

**Implement Solution 1**: Standardize on `user.profileImageUrl`.

## Acceptance Criteria

- [ ] Migration backfills profileImageUrl from image
- [ ] OAuth callback sets both fields
- [ ] All code uses profileImageUrl as primary
- [ ] Schema documented with field comments
- [ ] Integration test verifies migration

## Resources

- [User schema](/Users/joschuag/Developer/Public/gridtip/db/schema/auth-schema.ts)
- [Profile update](/Users/joschuag/Developer/Public/gridtip/actions/update-profile.ts)
