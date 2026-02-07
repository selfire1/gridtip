---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, security, validation, xss]
dependencies: []
---

# Weak Username Validation - Security and Data Quality Risk

## Problem Statement

Username fields across the application have minimal validation, allowing empty strings, special characters, extremely long inputs, and potentially malicious content like XSS payloads.

### Why This Matters

- **XSS Risk**: Usernames with `<script>` tags could be stored and executed
- **UI Breaking**: Special characters, emojis, or RTL override characters can break layouts
- **Impersonation**: Homograph attacks using lookalike Unicode characters
- **Data Quality**: Empty strings, whitespace-only names, or excessively long names
- **Database Bloat**: No length limits beyond schema max

## Findings

### Current Validation

**Join Group Schema** (`actions/join-group-schema.ts:6`):
```typescript
userName: z.string()  // No constraints!
```

**Create Group Schema** (`lib/schemas/create-group.ts:9`):
```typescript
userName: z.string()  // Same issue
```

### Attack Vectors

#### 1. XSS Payload
```typescript
userName: "<script>alert(document.cookie)</script>"
// Stored in database
// If rendered without escaping: XSS attack
```

**Current Protection**: React escapes by default, so this is mitigated in rendering. However, usernames should still be sanitized at input.

#### 2. Homograph Attack
```typescript
userName: "Admіn"  // Uses Cyrillic 'і' instead of Latin 'i'
// Looks like "Admin" but is different
// User could impersonate admin
```

#### 3. Zero-Width Characters
```typescript
userName: "John\u200BDoe"  // Contains zero-width space
// Appears as "JohnDoe" but is different in database
// Can bypass duplicate checks
```

#### 4. RTL Override
```typescript
userName: "User\u202Ename"  // RTL override character
// Can reverse text rendering
// Breaks UI layout
```

#### 5. Length Attacks
```typescript
userName: "A".repeat(10000)  // Extremely long
// Database bloat
// UI performance issues
```

#### 6. Empty/Whitespace
```typescript
userName: "   "  // Only spaces
// .trim() would make it empty
// But no minimum length check after trim
```

### Database Schema

**`group_members` table** (`db/schema/schema.ts:49`):
```typescript
userName: text().notNull()  // No max length constraint!
```

SQLite `text` type has no inherent length limit, so extremely long strings can be stored.

## Proposed Solutions

### Solution 1: Comprehensive Validation Schema (Recommended)

**Pros**:
- Prevents all identified attacks
- Consistent validation across app
- Type-safe
- Clear error messages

**Cons**:
- May reject some legitimate names
- Need to communicate restrictions to users

**Effort**: Small (2-3 hours)
**Risk**: Low

**Implementation**:

```typescript
// Create: lib/schemas/username.ts

import { z } from 'zod'

// Allowed characters: letters, numbers, spaces, and basic punctuation
const USERNAME_REGEX = /^[a-zA-Z0-9\s\-_.]+$/

export const UsernameSchema = z.string()
  .trim()
  .min(1, 'Username is required')
  .max(50, 'Username must be 50 characters or less')
  .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, spaces, hyphens, underscores, and periods')
  .refine((val) => val.length > 0, 'Username cannot be empty')
  .refine((val) => !/^\s+$/.test(val), 'Username cannot be only whitespace')
  .refine((val) => {
    // Check for zero-width characters
    const zeroWidthChars = /[\u200B-\u200D\uFEFF]/
    return !zeroWidthChars.test(val)
  }, 'Username contains invalid characters')

// Usage in schemas:
export const JoinGroupSchema = z.object({
  groupId: z.string().cuid2(),
  userName: UsernameSchema,
})

export const CreateGroupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.enum(SUPPORTED_ICON_NAMES),
  cutoff: z.coerce.number().min(0),
  userName: UsernameSchema,
})
```

### Solution 2: Add Server-Side Sanitization

**Pros**:
- More permissive (allows more names)
- Strips dangerous characters instead of rejecting

**Cons**:
- Less predictable (user input changes)
- Could still allow problematic strings

**Effort**: Medium (3-4 hours)
**Risk**: Medium

```typescript
import DOMPurify from 'isomorphic-dompurify'

function sanitizeUsername(username: string): string {
  // Remove HTML tags
  const sanitized = DOMPurify.sanitize(username, { ALLOWED_TAGS: [] })

  // Remove zero-width characters
  const cleaned = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // Trim and limit length
  return cleaned.trim().slice(0, 50)
}
```

**Not recommended**: Validation is clearer than silent sanitization.

### Solution 3: Database Constraint

**Pros**:
- Enforces at database level
- Last line of defense

**Cons**:
- SQLite has limited constraint options
- Would need CHECK constraint

**Effort**: Medium (3 hours)
**Risk**: Low

```sql
ALTER TABLE group_members ADD CONSTRAINT username_length
  CHECK (length(user_name) <= 50 AND length(user_name) > 0);
```

**Note**: This should be added **in addition to** application validation, not instead of.

## Recommended Action

**Implement Solution 1**: Create comprehensive validation schema with clear rules.

**Additionally**: Add database CHECK constraint for defense in depth.

## Technical Details

### Affected Files
- `/Users/joschuag/Developer/Public/gridtip/actions/join-group-schema.ts` (line 6)
- `/Users/joschuag/Developer/Public/gridtip/lib/schemas/create-group.ts` (line 9)
- `/Users/joschuag/Developer/Public/gridtip/components/profile-fields.tsx` (no validation on input)

### New Files
- `/Users/joschuag/Developer/Public/gridtip/lib/schemas/username.ts` (centralized username validation)

### Components to Update
- ProfileFields component (add validation feedback)
- Join group form (show username requirements)
- Create group form (show username requirements)

### User-Facing Changes
- Username input will show character requirements
- Invalid characters will be rejected with clear error
- Maximum length enforced (50 characters)

## Acceptance Criteria

- [ ] Centralized username validation schema created
- [ ] Regex restricts to safe characters only
- [ ] Minimum length: 1 character (after trim)
- [ ] Maximum length: 50 characters
- [ ] Empty strings and whitespace-only rejected
- [ ] Zero-width characters rejected
- [ ] XSS payloads rejected (< > script tags)
- [ ] Clear error messages for each validation rule
- [ ] Database CHECK constraint added
- [ ] Migration generated and applied
- [ ] UI shows username requirements to users
- [ ] Integration tests for invalid usernames

## Work Log

### 2026-02-07
- **Discovered**: Security Sentinel identified weak validation
- **Analyzed**: Multiple attack vectors possible
- **Assessed**: P2 - Important security issue but React provides XSS mitigation
- **Prioritized**: Should fix to improve data quality and defense in depth

## Resources

- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Unicode Security Issues](https://www.unicode.org/reports/tr36/)
- [Homograph Attacks](https://en.wikipedia.org/wiki/IDN_homograph_attack)
- [Zod Documentation](https://zod.dev)
- Related: [Security Audit Report - Issue #2](../security-audit.md)
