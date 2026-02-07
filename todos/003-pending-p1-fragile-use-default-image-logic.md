---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, logic-bug, state-management, onboarding, profile]
dependencies: []
---

# Fragile "useDefaultImage" Detection Logic

## Problem Statement

The logic for determining whether a user wants to use their default profile image is brittle and relies on implicit state inference. This leads to false positives, false negatives, and unpredictable behavior.

### Why This Matters

- **User Intent Lost**: System can't distinguish between "user hasn't touched field" vs "user explicitly removed image"
- **Wrong Image Used**: User may get default image when they wanted no image, or vice versa
- **Tight Coupling**: Code has a TODO comment admitting this is "not ideal" and needs refactoring
- **Inconsistent Behavior**: Same logic duplicated 3 times with slight variations

## Findings

**Primary Location**: `actions/complete-onboarding.tsx:56-63`

```typescript
// TODO: this check here is not ideal. there is tight coupling. We need to find a better way to track this state reliably
const hasUserNotRemovedDefaultImage = !!(
  input.profileData?.imagePreview && !input.profileData.imageFile
)
```

### The Logic Problem

This boolean expression evaluates to `true` (use default image) when:
- `imagePreview` exists (has a value)
- AND `imageFile` does NOT exist (is undefined)

**Ambiguous Scenarios**:

1. **Scenario A: OAuth Default Image**
   - User logs in with Google
   - `imagePreview = user.profileImageUrl || user.image` (from OAuth)
   - `imageFile = undefined` (never uploaded)
   - **Result**: `true` - Use default ✓ Correct

2. **Scenario B: User Uploaded Then Removed**
   - User uploads custom image
   - User clicks X button to remove it
   - `ProfileFields.tsx:85` sets both to `undefined`
   - **Result**: `false` - Don't use default ✗ Wrong! User may want default

3. **Scenario C: User Never Touched Field**
   - User sees profile screen with OAuth image preview
   - User doesn't interact with image field
   - `imagePreview` still set, `imageFile` undefined
   - **Result**: `true` - Use default ✓ Correct

3. **The Three States Problem**

The system treats these identically:
- Initial state (has OAuth image)
- User removed image (wants no image or default)
- User never interacted (keep OAuth image)

But they require **different handling**!

### Code Duplication

This fragile logic appears in **3 locations with variations**:

1. **Onboarding - Create/Join Group** (`complete-onboarding.tsx:57`):
```typescript
const hasUserNotRemovedDefaultImage = !!(
  input.profileData?.imagePreview && !input.profileData.imageFile
)
```

2. **Onboarding - Global Group** (`complete-onboarding.tsx:166`):
```typescript
const hasUserNotRemovedDefaultImage = !!(
  input.profileImagePreview && !input.profileImageFile
)
```

3. **Standalone Join Page** (`join-group-form.tsx:94`):
```typescript
useDefaultImage: image.preview === user.profileImageUrl  // Different logic!
```

**Inconsistency**: The standalone join page uses **strict equality** instead of boolean inference. This means the two flows handle default images differently!

### Developer Acknowledgment

The code itself admits the problem:
```typescript
// TODO: this check here is not ideal. there is tight coupling.
// We need to find a better way to track this state reliably
```

## Proposed Solutions

### Solution 1: Explicit Action Enum (Recommended)

**Pros**:
- Unambiguous user intent
- Type-safe
- Easy to reason about
- Eliminates all edge cases

**Cons**:
- Requires refactoring ProfileState type
- Changes component API

**Effort**: Medium (4-5 hours)
**Risk**: Low

**Implementation**:

```typescript
// 1. Define explicit action type
type ImageAction =
  | { type: 'keep-default' }
  | { type: 'upload', file: File, preview: string }
  | { type: 'remove' }
  | { type: 'unchanged' }  // User hasn't interacted

// 2. Update ProfileState
export type ProfileState = {
  name: string
  imageAction: ImageAction
}

// 3. Update ProfileFields component
export default function ProfileFields({
  id,
  name,
  imageAction,
  onImageActionChange,
  onNameChange,
}: {
  id: string
  imageAction: ImageAction
  name: string
  onNameChange: (name: string) => void
  onImageActionChange: (action: ImageAction) => void
}) {
  return (
    <>
      {/* Name field */}
      <Field>...</Field>

      {/* Image field */}
      <Button onClick={() => onImageActionChange({ type: 'remove' })}>
        <LucideX />
      </Button>

      <Input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onImageActionChange({
              type: 'upload',
              file,
              preview: URL.createObjectURL(file)
            })
          }
        }}
      />
    </>
  )
}

// 4. Update complete-onboarding.tsx logic
function getImageUrl(imageAction: ImageAction, defaultUrl: string | null | undefined): string | undefined {
  switch (imageAction.type) {
    case 'keep-default':
    case 'unchanged':
      return defaultUrl || undefined
    case 'upload':
      // Will upload file and return new URL
      return undefined  // Handled separately
    case 'remove':
      return undefined  // Explicitly no image
  }
}
```

### Solution 2: Three-State Boolean

**Pros**:
- Simpler than enum
- Less refactoring

**Cons**:
- Still somewhat ambiguous
- `undefined` means different things in different contexts

**Effort**: Small (2-3 hours)
**Risk**: Low

```typescript
type ProfileState = {
  name: string
  imagePreview: string | undefined
  imageFile: File | undefined
  useDefaultImage: boolean | undefined  // undefined = user hasn't decided
}

// undefined = no interaction yet (use default)
// true = user explicitly chose to use default
// false = user explicitly removed or uploaded new
```

### Solution 3: Track User Interaction Separately

**Pros**:
- Minimal changes to existing code
- Clear intent tracking

**Cons**:
- Adds another field
- More complex state

**Effort**: Medium (3-4 hours)
**Risk**: Low

```typescript
type ProfileState = {
  name: string
  imagePreview: string | undefined
  imageFile: File | undefined
  hasUserInteractedWithImage: boolean  // Track if user touched the field
}
```

## Recommended Action

**Implement Solution 1 (Explicit Action Enum)**.

This is the cleanest long-term solution that eliminates all ambiguity.

## Technical Details

### Affected Files
- `/Users/joschuag/Developer/Public/gridtip/actions/complete-onboarding.tsx` (lines 56-63, 166-168)
- `/Users/joschuag/Developer/Public/gridtip/app/(standalone)/join/[groupId]/_components/join-group-form.tsx` (line 94)
- `/Users/joschuag/Developer/Public/gridtip/components/profile-fields.tsx` (entire component)
- `/Users/joschuag/Developer/Public/gridtip/app/(onboarding)/tipping/onboarding/_components/screens/profile-screen.tsx` (state management)
- `/Users/joschuag/Developer/Public/gridtip/app/(onboarding)/tipping/onboarding/_lib/onboarding-context.tsx` (ProfileState type)

### State Type Changes
```typescript
// Current (ambiguous):
type ProfileState = {
  name: string
  imagePreview: string | undefined
  imageFile: File | undefined
}

// Proposed (explicit):
type ProfileState = {
  name: string
  imageAction: ImageAction
}
```

## Acceptance Criteria

- [ ] User intent for profile image is explicitly tracked (upload/remove/keep-default/unchanged)
- [ ] No boolean inference logic remains
- [ ] Remove button sets action to 'remove', not undefined/undefined
- [ ] Upload sets action to 'upload' with file
- [ ] Initial state is 'unchanged' (user hasn't interacted)
- [ ] Choosing to keep OAuth image is explicit 'keep-default' action
- [ ] All three locations (create, join, global) use same logic
- [ ] TODO comment removed
- [ ] Integration tests cover all image action scenarios

## Work Log

### 2026-02-07
- **Discovered**: Pattern Recognition Specialist identified fragile logic
- **Analyzed**: Found 3 occurrences with different implementations
- **Developer Comment**: Existing TODO confirms this needs refactoring
- **Assessed**: P1 priority due to unpredictable behavior and developer acknowledgment

## Resources

- [TODO comment in complete-onboarding.tsx:56](/Users/joschuag/Developer/Public/gridtip/actions/complete-onboarding.tsx#L56)
- [ProfileFields component](/Users/joschuag/Developer/Public/gridtip/components/profile-fields.tsx)
- [Inconsistent join page logic](/Users/joschuag/Developer/Public/gridtip/app/(standalone)/join/[groupId]/_components/join-group-form.tsx#L94)
- Related: [Data Integrity Issue #3 - Inconsistent Profile Image Fields](./007-pending-p2-inconsistent-profile-image-fields.md)
