# CLAUDE.md

## Project Overview

**GridTip** — F1 season tipping app. Users predict race outcomes (pole, P1, P10, last, constructor with most points, sprint P1) and compete in groups. Tips lock before qualifying/sprint qualifying based on a configurable cutoff (default 180 min).

## Tech Stack

- **Next.js 15** (App Router) / **React 19** / **TypeScript** (strict) / **Bun**
- **Turso** (SQLite) + **Drizzle ORM** — `snake_case` columns
- **better-auth** with Google OAuth
- **Tailwind CSS 4** + **shadcn/ui** + **Lucide React**
- **react-hook-form** + **Zod 4**
- **Vitest** for testing

## Key Project-Specific Details

### Path Aliases

- `@/*` → project root
- `@@/*` → `/app` directory

### F1 Data Source

Jolpica F1 API: `https://api.jolpi.ca/ergast/f1/`
Updated via protected `/api/*/update` endpoints (Basic Auth with `UPDATES_USER` + `UPDATES_PASSWORD_HASH`).

### Prediction Fields

Defined in `lib/utils/prediction-fields.ts`:
- Race: `sprintP1`, `pole`, `p1`, `p10`, `last`, `constructorWithMostPoints`
- Championship: `championshipConstructor`, `championshipDriver`
- Cutoff reference: most fields use `qualifyingDate`, `sprintP1` uses `sprintQualifyingDate`

### DAL (Data Access Layer) — `lib/dal.ts`

- `verifySession()` — cached, redirects if unauthenticated
- `getMaybeSession()` — optional session
- `getMemberStatus(groupId)` — returns Admin | Member
- `verifyIsAdmin(groupId)` — cached admin check

### Cache Tags — `constants/cache.ts`

`CacheTag` enum: `Results`, `Constructors`, `Drivers`, `Races`, `Predictions`. Always revalidate relevant tags when mutating data.

### Server Actions

Return `ServerResponse` (`{ ok: boolean, message: string }`). Always `verifySession()` first, validate with Zod. Located in `/actions/` or colocated `actions/` dirs.

### Database Types

Generated in `db/types`. Use `import type { Database } from '@/db/types'`.

### Colocation Pattern

Route-specific code lives with the route: `_components/`, `actions/`, `_utils/` subdirectories.

### Navigation

Sidebar items: `components/nav-main.tsx`. Breadcrumbs: `components/breadcrumbs.tsx`.

### Admin Features

Group admins can overwrite predictions with `countAsCorrect` / `countAsIncorrect` via `prediction_entries.overwriteTo`.

## TypeScript Conventions

- Use `type` over `interface`
- Use `import type` for type-only imports
- Named exports for components
- Files: `kebab-case`, components: `PascalCase`, constants: `SCREAMING_SNAKE_CASE`
