---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, security, dos, performance]
dependencies: []
---

# No Rate Limiting on Server Actions - DoS and Cost Risk

## Problem Statement

None of the onboarding server actions have rate limiting, allowing malicious users to spam operations, exhaust resources, and inflate costs.

### Why This Matters

- **DoS Attack**: Malicious user can spam requests
- **Storage Exhaustion**: Unlimited file uploads
- **Cost Inflation**: UploadThing bandwidth charges
- **Database Load**: Spam creates unnecessary records

## Findings

### Unprotected Actions

1. **Create Group** - No limit on group creation
2. **Join Group** - Can spam join requests
3. **Upload Image** - No upload limit
4. **Complete Onboarding** - Can spam completion

### Attack Scenario

```bash
# Create 10,000 groups
for i in {1..10000}; do
  curl -X POST /api/create-group -d "name=Spam $i"
done
```

## Proposed Solutions

### Solution 1: Upstash Rate Limit (Recommended)

**Pros**:
- Industry-standard
- Works in serverless
- Simple API

**Cons**:
- External dependency

**Effort**: Small (2-3 hours)
**Risk**: Low

**Implementation**:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const createGroupLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
})

// In action:
const { success } = await createGroupLimiter.limit(user.id)
if (!success) {
  return { ok: false, message: 'Too many requests' }
}
```

## Recommended Action

**Implement Solution 1**: Use Upstash Rate Limit.

### Recommended Limits

- Create Group: 5/hour
- Join Group: 20/hour
- Upload Image: 10/hour
- Complete Onboarding: 3/day

## Acceptance Criteria

- [ ] Upstash Redis configured
- [ ] Rate limiters created for each action
- [ ] Clear error messages when limited
- [ ] Integration tests for rate limiting

## Resources

- [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
