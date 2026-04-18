# Client-Side Caching Plan

## Problem

No client-side caching. Every app launch makes 3 API calls (form-details, groups, tips) before showing any UI, leading to slow startup and unnecessary load.

## Approach

Use TanStack Query with AsyncStorage persistence for client-side caching, and a new lightweight server endpoint for automatic staleness checks.

## Server Changes

### New endpoint: `GET /api/v1/cache-version`

Returns the latest `lastUpdated` timestamp from each table:

```json
{
  "drivers": 1713400000,
  "constructors": 1713400000,
  "races": 1713400000
}
```

Implementation: `SELECT MAX(lastUpdated) FROM drivers`, same for constructors and races. These columns already exist in the schema.

This endpoint is authenticated (same Bearer token as other v1 routes), so it won't be CDN-cached, but the query is cheap (three scalar reads).

## Client Changes

### 1. Add TanStack Query with persistence

- Install `@tanstack/react-query` and `@tanstack/query-async-storage-persister`
- Configure `QueryClient` with `gcTime: Infinity` for cached resource queries
- Set up `persistQueryClient` with Expo's `AsyncStorage`

### 2. Wrap data fetching in query hooks

Split the current `loadInitialState()` into separate queries:

| Query Key | Source | `staleTime` |
|-----------|--------|-------------|
| `['drivers']` | `form-details` (drivers array) | `Infinity` |
| `['constructors']` | `form-details` (constructors array) | `Infinity` |
| `['race']` | `form-details` (race object) | `Infinity` |
| `['groups']` | `my/groups` | `Infinity` |
| `['tips', groupId, raceId]` | `tips/get` | `0` (always fresh) |

All resource queries use `staleTime: Infinity` because staleness is determined by the version check, not by time.

Tips are always fetched fresh since they're user-specific and the user needs to see their latest submission.

### 3. Version check on app startup and foreground resume

On app launch and `AppState` change to `active`:

1. Fetch `/api/v1/cache-version`
2. Compare each timestamp against locally stored values (in AsyncStorage)
3. For any that changed, call `queryClient.invalidateQueries({ queryKey: ['drivers'] })` (etc.)
4. Update stored timestamps

This is a blocking call before rendering the form, but it's fast (~100 bytes response). The selective invalidation means only changed data is re-fetched; unchanged data loads instantly from cache.

### 4. Consider splitting `form-details`

The current `form-details` endpoint bundles race + drivers + constructors into one response. To enable selective invalidation, either:

- **Option A:** Split into `/api/v1/race`, `/api/v1/drivers`, `/api/v1/constructors` (cleaner, but 3 requests instead of 1 on cache miss)
- **Option B:** Keep `form-details` but cache its sub-objects under separate query keys client-side (parse one response into three cache entries)

Option B avoids server changes and extra round-trips. On a cache miss for any of the three, refetch the bundle and update all three cache entries.

## Startup Flow

```
App opens
  |
  v
Load persisted query cache from AsyncStorage (instant)
  |
  v
Show UI with cached data immediately
  |
  v
Fetch /api/v1/cache-version
  |
  v
Compare timestamps -> invalidate stale queries
  |
  v
Stale queries refetch in background, UI updates when ready
  |
  v
Fetch tips/get (always fresh, needs race + group context)
```

## What This Gets Us

- **Instant startup** on repeat launches (data loads from AsyncStorage before any network call)
- **Automatic freshness** without manual refresh buttons
- **Selective revalidation** so unchanged data is never re-fetched
- **Server-controlled invalidation** via the timestamps already in the database
- **Minimal server changes** (one new endpoint, no schema changes)
