# CLAUDE.md - AI Assistant Guide for GridTip

> **Last Updated**: 2025-11-21
> **Project**: GridTip - F1 Season Tipping Application
> **Live URL**: [gridtip.joschua.io](https://gridtip.joschua.io)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Code Conventions & Style](#code-conventions--style)
7. [Development Workflows](#development-workflows)
8. [Key Features & Routes](#key-features--routes)
9. [Common Patterns](#common-patterns)
10. [Testing](#testing)
11. [Deployment & CI/CD](#deployment--cicd)
12. [Common Tasks](#common-tasks)
13. [Important File References](#important-file-references)

---

## Project Overview

**GridTip** is an F1 season tipping application where users predict race outcomes and compete with friends in groups.

### Core Concepts

- **Groups**: Users create or join groups to compete with friends
- **Predictions/Tips**: Users predict race outcomes (pole, P1, P10, last place, sprint results, etc.)
- **Cutoff System**: Tips lock before qualifying/sprint qualifying (default: 180 minutes)
- **Leaderboard**: Track standings and compare predictions with group members
- **Admin Controls**: Group admins can manage tips and manually override scoring
- **Championship Predictions**: Season-long predictions for driver and constructor championships

### Data Source

All F1 data (races, drivers, constructors, results) comes from the **Jolpica F1 API**:
- API Base: `https://api.jolpi.ca/ergast/f1/`
- Documentation: [jolpica-f1 API docs](https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md)
- Updated via protected API endpoints (see API Routes section)

---

## Tech Stack

### Core Framework
- **Next.js** 15.5.2 (App Router, React Server Components)
- **React** 19.1.0
- **TypeScript** 5.x (strict mode)
- **Bun** (runtime and package manager)

### Database & ORM
- **Turso** (SQLite edge database)
- **Drizzle ORM** 0.44.5
- **@libsql/client** 0.15.14
- **Convention**: `snake_case` for database columns

### Authentication
- **better-auth** 1.3.8
- **Google OAuth** provider
- **bcryptjs** for password hashing
- Session duration: 7 days

### UI & Styling
- **Tailwind CSS** 4.x
- **shadcn/ui** (New York style)
- **Radix UI** primitives
- **Lucide React** for icons
- **next-themes** for dark mode
- **CVA** (class-variance-authority) for component variants

### Forms & Validation
- **react-hook-form** 7.62.0
- **Zod** 4.1.12 for schema validation
- **@hookform/resolvers** for integration

### Other Key Libraries
- **@tanstack/react-table** 8.21.3 (admin tables)
- **date-fns** 4.1.0 (date manipulation)
- **ofetch** 1.4.1 (HTTP client)
- **sonner** 2.0.7 (toast notifications)
- **marked** 16.4.0 (markdown parsing)

### Development Tools
- **Vitest** 3.2.4 (testing with jsdom)
- **ESLint** 9.x + Prettier
- **drizzle-kit** (migrations)

---

## Directory Structure

```
/home/user/gridtip/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (landing, contact)
│   ├── (standalone)/             # Standalone pages (auth, join)
│   ├── api/                      # API routes
│   │   ├── auth/[...all]/        # better-auth catch-all
│   │   ├── races/update/         # Race data updates
│   │   ├── drivers/update/       # Driver data updates
│   │   ├── constructors/update/  # Constructor data updates
│   │   ├── results/update/       # Results data updates
│   │   └── utils.ts              # API utilities
│   ├── tipping/                  # Protected app routes
│   │   ├── add-tips/[race-id]/   # Add/edit race tips
│   │   ├── championships/        # Championship predictions
│   │   ├── groups/               # Group management
│   │   ├── group-admin/          # Admin panel
│   │   ├── leaderboard/          # Results and standings
│   │   ├── settings/             # User settings
│   │   └── page.tsx              # Dashboard
│   ├── manifest.ts               # PWA manifest
│   └── middleware.ts             # Auth middleware
│
├── components/
│   ├── ui/                       # shadcn/ui components (27 components)
│   └── [custom-components].tsx   # App-specific components
│
├── db/
│   ├── schema/
│   │   ├── schema.ts             # Main application schema
│   │   └── auth-schema.ts        # Authentication schema
│   ├── migrations/               # Drizzle migrations
│   ├── types/                    # Generated DB types
│   └── index.ts                  # Database client
│
├── lib/
│   ├── auth.ts                   # better-auth server config
│   ├── auth-client.ts            # Client-side auth
│   ├── dal.ts                    # Data Access Layer
│   ├── utils.ts                  # Utility functions (cn)
│   ├── schemas/                  # Zod validation schemas
│   └── utils/                    # Domain-specific utils
│
├── actions/                      # Server actions
│   ├── create-group.ts
│   ├── join-group.ts
│   ├── edit-group.ts
│   └── delete-user.ts
│
├── constants/
│   ├── index.ts                  # Core constants
│   ├── cache.ts                  # Cache tags enum
│   └── icon-names.ts             # Group icon options
│
├── types/
│   ├── index.ts                  # Global TypeScript types
│   └── ergast.ts                 # Jolpica API types
│
├── hooks/
│   └── use-mobile.ts             # Responsive hook
│
├── scripts/
│   └── save-avatars.ts           # Download user avatars (prebuild)
│
├── __tests__/                    # Vitest tests
│
├── public/                       # Static assets
│   └── img/user/                 # Cached user avatars
│
└── css/                          # Global styles
```

---

## Database Schema

### Application Tables

#### `groups`
```typescript
{
  id: string (cuid2, PK)
  name: string
  adminUser: string (FK → user.id)
  createdAt: timestamp
  cutoffInMinutes: number (default: 180)
  iconName: enum (default: 'lucide:users')
}
```

#### `group_members`
```typescript
{
  id: string (cuid2, PK)
  groupId: string (FK → groups.id, CASCADE)
  userId: string (FK → user.id, CASCADE)
  joinedAt: timestamp
}
```

#### `races`
```typescript
{
  id: string (circuit ID, PK)
  country: string
  locality: string
  round: number
  circuitName: string
  raceName: string
  grandPrixDate: timestamp
  qualifyingDate: timestamp
  sprintDate: timestamp | null
  sprintQualifyingDate: timestamp | null
  lastUpdated: timestamp
  created: timestamp
}
```

#### `drivers`
```typescript
{
  id: string (PK)
  permanentNumber: string
  fullName: string
  givenName: string
  familyName: string
  nationality: string
  constructorId: string (FK → constructors.id, CASCADE)
  lastUpdated: timestamp
  created: timestamp
}
```

#### `constructors`
```typescript
{
  id: string (PK)
  name: string
  nationality: string
  created: timestamp
  lastUpdated: timestamp
}
```

#### `predictions`
```typescript
{
  id: string (cuid2, PK)
  userId: string (FK → user.id, CASCADE)
  groupId: string (FK → groups.id, CASCADE)
  isForChampionship: boolean (default: false)
  raceId: string | null (FK → races.id, CASCADE)
  createdAt: timestamp

  // Indexes on: userId, groupId, isForChampionship, raceId
}
```

#### `prediction_entries`
```typescript
{
  id: string (cuid2, PK)
  predictionId: string (FK → predictions.id, CASCADE)
  position: enum (PREDICTION_FIELDS)
  driverId: string | null (FK → drivers.id, CASCADE)
  constructorId: string | null (FK → constructors.id, CASCADE)
  overwriteTo: 'countAsCorrect' | 'countAsIncorrect' | null
  createdAt: timestamp

  // Unique constraint: (predictionId, position)
}
```

#### `results`
```typescript
{
  id: string (cuid2, PK)
  raceId: string (FK → races.id, CASCADE)
  driverId: string | null (FK → drivers.id, CASCADE)
  constructorId: string (FK → constructors.id, CASCADE)
  sprint: number | null
  grid: number | null
  position: number | null
  points: number
  status: string
  addedAt: timestamp
  updatedAt: timestamp
}
```

### Authentication Tables

#### `user`
```typescript
{
  id: string (PK)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `session`
```typescript
{
  id: string (PK)
  token: string (unique)
  expiresAt: timestamp
  ipAddress: string | null
  userAgent: string | null
  userId: string (FK → user.id, CASCADE)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `account`
```typescript
{
  id: string (PK)
  accountId: string
  providerId: string
  userId: string (FK → user.id, CASCADE)
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: timestamp | null
  refreshTokenExpiresAt: timestamp | null
  scope: string | null
  password: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `verification`
```typescript
{
  id: string (PK)
  identifier: string
  value: string
  expiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Prediction Fields Constants

```typescript
// Race prediction fields
DRIVER_RACE_PREDICTION_FIELDS = ['sprintP1', 'pole', 'p1', 'p10', 'last']
CONSTRUCTOR_RACE_PREDICTION_FIELDS = ['constructorWithMostPoints']

// Championship prediction fields
CHAMPIONSHIP_PREDICTION_FIELDS = ['championshipConstructor', 'championshipDriver']

// Cutoff reference mapping
CUTOFF_REFERENCE_KEY = {
  pole: 'qualifyingDate',
  p1: 'qualifyingDate',
  p10: 'qualifyingDate',
  last: 'qualifyingDate',
  constructorWithMostPoints: 'qualifyingDate',
  sprintP1: 'sprintQualifyingDate',
}
```

**Location**: `/home/user/gridtip/db/schema/schema.ts`

---

## Authentication & Authorization

### Configuration

**better-auth** setup in `/home/user/gridtip/lib/auth.ts`:
- Session expires: 7 days
- Session update age: 1 day
- Cookie cache: 5 minutes
- Google OAuth provider
- User deletion enabled

### Environment Variables Required

```bash
BETTER_AUTH_SECRET=          # Secret for session encryption
BETTER_AUTH_URL=             # App URL (e.g., https://gridtip.joschua.io)
GOOGLE_CLIENT_ID=            # Google OAuth client ID
GOOGLE_CLIENT_SECRET=        # Google OAuth client secret
TURSO_DATABASE_URL=          # Turso database URL
TURSO_AUTH_TOKEN=            # Turso auth token
UPDATES_USER=                # Basic auth user for API updates
UPDATES_PASSWORD_HASH=       # Bcrypt hash for API updates
```

### Key Functions (DAL - Data Access Layer)

Location: `/home/user/gridtip/lib/dal.ts`

```typescript
// Verify session (cached, redirects if not authenticated)
await verifySession()

// Optional session retrieval
const session = await getMaybeSession()

// Get member status (Admin | Member)
const status = await getMemberStatus(groupId)

// Verify admin status (cached)
await verifyIsAdmin(groupId)
```

### Protected Routes

**Middleware** (`/home/user/gridtip/app/middleware.ts`):
- Protected path: `/tipping/*`
- Redirects to: `/auth?origin=not-logged-in`

### API Route Protection

Update endpoints use Basic Auth (`validateToken()` in `/home/user/gridtip/app/api/utils.ts`):
- Requires `UPDATES_USER` and `UPDATES_PASSWORD_HASH`
- Applied to: `/api/races/update`, `/api/drivers/update`, `/api/constructors/update`, `/api/results/update`

---

## Code Conventions & Style

### Code Style

**Enforced via ESLint + Prettier**:
```javascript
{
  singleQuote: true,      // Use single quotes
  semi: false,            // No semicolons
  jsxSingleQuote: true    // Single quotes in JSX
}
```

**Example**:
```typescript
// ✅ Correct
const myVar = 'hello'
const Component = () => <div className='text-red-500'>Hello</div>

// ❌ Incorrect
const myVar = "hello";
const Component = () => <div className="text-red-500">Hello</div>;
```

### TypeScript Conventions

1. **Strict mode enabled** - All TypeScript strict checks active
2. **Path aliases**:
   - `@/*` → project root
   - `@@/*` → `/app` directory
3. **Type imports**: Use `import type` for type-only imports
4. **Database types**: Generated in `/home/user/gridtip/db/types`

### Naming Conventions

1. **Files & Directories**:
   - Components: `kebab-case.tsx` (e.g., `group-switcher.tsx`)
   - Routes: `kebab-case` (e.g., `add-tips/`)
   - Utilities: `kebab-case.ts` (e.g., `prediction-fields.ts`)

2. **Database**:
   - Tables: `snake_case` (e.g., `group_members`)
   - Columns: `snake_case` (enforced by Drizzle config)

3. **React Components**:
   - PascalCase (e.g., `GroupSwitcher`)
   - Use named exports for consistency

4. **Functions**:
   - camelCase (e.g., `getMemberStatus`)
   - Server actions: descriptive names (e.g., `createGroup`)

5. **Constants**:
   - SCREAMING_SNAKE_CASE (e.g., `DEFAULT_CUTOFF_MINS`)
   - Enums: PascalCase (e.g., `CacheTag.Results`)

### Component Organization

**Colocation pattern** - Route-specific code lives with the route:
```
app/tipping/add-tips/[race-id]/
├── page.tsx                    # Route component
├── _components/                # Route-specific components
│   └── tip-form.tsx
├── actions/                    # Route-specific actions
│   └── submit-tips.ts
└── _utils/                     # Route-specific utilities
    └── validation.ts
```

### Import Order (Recommended)

```typescript
// 1. React & Next.js
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

// 2. External packages
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 3. Internal aliases (@/*)
import { db } from '@/db'
import { verifySession } from '@/lib/dal'

// 4. Relative imports
import { TipForm } from './_components/tip-form'
import { validateTips } from './_utils/validation'
```

---

## Development Workflows

### Setup

```bash
# Install dependencies
bun install

# Start development server (port 4848)
bun run dev

# Start with production NODE_ENV
bun run dev:prod
```

### Database Workflows

```bash
# Generate Drizzle migration
bun run db:generate

# Apply migrations
bun run db:migrate

# Production database operations
bun run db:prod:generate
bun run db:prod:migrate

# Dump Turso DB to local SQLite
bun run db:dump
```

**Drizzle Config**: `/home/user/gridtip/drizzle.config.ts`
- Dialect: `turso`
- Casing: `snake_case`
- Schema files: `db/schema/schema.ts`, `db/schema/auth-schema.ts`
- Migrations: `db/migrations/`

### Testing

```bash
# Run tests (Vitest)
bun run test

# Lint
bun run lint
```

### Building & Deployment

```bash
# Build for production
bun run build

# Note: prebuild hook runs scripts/save-avatars.ts

# Start production server
bun run start
```

### Scripts

```bash
# Update tips programmatically (production)
bun run update-tips
```

### Git Commit Workflow

**Recent commit pattern**:
```
feat: count admin overwrite (#8)
fix: only require prediction id if editing
ci: run linter instead of whole build
```

**Conventions**:
- Prefix: `feat:`, `fix:`, `ci:`, `chore:`, `docs:`
- Include PR number: `(#123)`
- Use `[skip ci]` to skip CI runs

---

## Key Features & Routes

### Public Routes (`app/(public)/`)

- **`/`** - Landing page
- **`/contact`** - Contact information

### Standalone Routes (`app/(standalone)/`)

- **`/auth`** - Authentication page (Google OAuth)
- **`/join/[groupId]`** - Join group via shareable link

### Protected Routes (`app/tipping/`)

#### Dashboard (`/tipping`)
**File**: `/home/user/gridtip/app/tipping/page.tsx`

Dynamic cards based on state:
- Join/create group prompt (if no groups)
- Next race tipping card (with cutoff countdown)
- Tipping status (who has/hasn't tipped)
- Everyone's tips (accordion, locked before cutoff)
- Previous race results

#### Add Tips (`/tipping/add-tips/[race-id]`)
**File**: `/home/user/gridtip/app/tipping/add-tips/[race-id]/page.tsx`

- Predict: pole, P1, P10, last place, constructor with most points
- Sprint races: also predict sprint P1
- Cutoff enforcement (default: 180 min before qualifying)
- Edit existing tips before cutoff
- Form validation via Zod

#### Championships (`/tipping/championships`)
**File**: `/home/user/gridtip/app/tipping/championships/page.tsx`

- Predict championship winner (driver)
- Predict championship winner (constructor)
- Season-long predictions

#### Leaderboard (`/tipping/leaderboard`)
**File**: `/home/user/gridtip/app/tipping/leaderboard/page.tsx`

- View race results
- Group standings
- Past race predictions vs. actual results
- Results comparison table

#### Groups (`/tipping/groups`)
**File**: `/home/user/gridtip/app/tipping/groups/page.tsx`

- Create new group
- Edit group settings (name, icon, cutoff time)
- View group members
- Leave group

#### Group Admin (`/tipping/group-admin`)
**File**: `/home/user/gridtip/app/tipping/group-admin/page.tsx`

**Requires**: Admin status

Features:
- View all user tips in data table (@tanstack/react-table)
- Edit/create tips on behalf of users
- Admin overwrite system:
  - Mark predictions as correct (`countAsCorrect`)
  - Mark predictions as incorrect (`countAsIncorrect`)
- Update results button (clears cache)

#### Settings (`/tipping/settings`)
**File**: `/home/user/gridtip/app/tipping/settings/page.tsx`

- Account deletion
- Profile information

### API Routes (`app/api/`)

#### Authentication
- **`POST/GET /api/auth/[...all]`** - better-auth catch-all handler

#### Data Updates (Protected with Basic Auth)

All require `UPDATES_USER` and `UPDATES_PASSWORD_HASH`:

- **`GET /api/races/update`** - Fetch and update race data from Jolpica API
- **`GET /api/drivers/update`** - Update driver data
- **`GET /api/constructors/update`** - Update constructor data
- **`GET /api/results/update`** - Update race results

**API Utils** (`app/api/utils.ts`):
```typescript
fetchJolpica()       // ofetch instance for Jolpica API
validateToken()      // Basic auth validation
createResponse()     // Standardized JSON responses
areFieldsTheSame()   // Compare objects for updates
```

---

## Common Patterns

### React Server Components (Default)

Most page and layout components are RSCs:
```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await db.query.races.findMany()
  return <div>{/* ... */}</div>
}
```

### Client Components

Use `"use client"` directive when needed:
```typescript
// ✅ Client Component
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  // ...
}
```

**When to use Client Components**:
- Forms with `react-hook-form`
- Interactive UI (combobox, dialogs)
- Components using hooks (`useState`, `useEffect`)
- Event handlers

### Server Actions

**Pattern** (see `/home/user/gridtip/actions/`):

```typescript
'use server'

import { z } from 'zod'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { ServerResponse } from '@/types'

const schema = z.object({
  name: z.string().min(1),
})

export async function createGroup(
  input: z.infer<typeof schema>
): Promise<ServerResponse> {
  // 1. Verify session
  const { user } = await verifySession()

  // 2. Validate input
  const validatedInput = schema.parse(input)

  // 3. Database operations
  const [group] = await db.insert(groups).values({
    name: validatedInput.name,
    adminUser: user.id,
  }).returning()

  // 4. Return standardized response
  return { ok: true, message: 'Group created' }
}
```

**Response type**:
```typescript
type ServerResponse = {
  ok: boolean
  message: string
}
```

### Data Fetching & Caching

**Pattern 1: `cache()` for request memoization**
```typescript
import { cache } from 'react'

export const getDrivers = cache(async () => {
  return db.query.drivers.findMany()
})
```

**Pattern 2: `unstable_cache()` for persistence**
```typescript
import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'

export const getRaces = unstable_cache(
  async () => db.query.races.findMany(),
  ['races'],
  { tags: [CacheTag.Races] }
)
```

**Cache Tags** (`/home/user/gridtip/constants/cache.ts`):
```typescript
enum CacheTag {
  Results = 'results',
  Constructors = 'constructors',
  Drivers = 'drivers',
  Races = 'races',
  Predictions = 'predictions',
}
```

**Revalidation**:
```typescript
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'

// Revalidate specific cache tag
revalidateTag(CacheTag.Races)
```

### Form Handling

**Pattern** (with `react-hook-form` + Zod):

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = await createGroup(data)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Component Composition

**Pattern**: Small, focused components
```typescript
// ✅ Good - Composable components
function CardJoinGroup() {
  return <Card>{/* ... */}</Card>
}

function CardTipNext({ race, groupId }: Props) {
  return <Card>{/* ... */}</Card>
}

export default function Dashboard() {
  return (
    <div>
      {!hasGroups && <CardJoinGroup />}
      {currentRace && <CardTipNext race={currentRace} groupId={groupId} />}
    </div>
  )
}
```

### Utility Functions

**`cn()` for className merging** (`/home/user/gridtip/lib/utils.ts`):
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className // Allow prop override
)} />
```

### Type Safety

**Database types** (`/home/user/gridtip/db/types`):
```typescript
import { Database } from '@/db/types'

type User = Database.User
type Race = Database.Race
```

**Const assertions for type narrowing**:
```typescript
export const PREDICTION_FIELDS = [
  'pole', 'p1', 'p10', 'last'
] as const

type PredictionField = (typeof PREDICTION_FIELDS)[number]
// Type: 'pole' | 'p1' | 'p10' | 'last'
```

---

## Testing

### Framework: Vitest

**Configuration**: `/home/user/gridtip/vitest.config.mts`
```typescript
{
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom'
  }
}
```

### Test Location

`/home/user/gridtip/__tests__/`

### Running Tests

```bash
bun run test
```

### Test Patterns

**Example** (`__tests__/cutoff.test.ts`):
```typescript
import { describe, it, expect } from 'vitest'
import { getClosedFields, isRaceAbleToBeTipped } from '@/lib/utils/races'

describe('sprint race', () => {
  it('sets sprintP1 as closed', () => {
    const result = getClosedFields(givenRace, givenCutoff, givenDate)
    expect(result).toEqual(new Set(['sprintP1']))
  })

  it('is not closed if sprint race', () => {
    const result = isRaceAbleToBeTipped(givenRace, givenCutoff, givenDate)
    expect(result).toBe(true)
  })
})
```

### Testing Libraries Available

- **Vitest**: Test runner
- **@testing-library/react**: Component testing
- **@testing-library/dom**: DOM testing utilities
- **jsdom**: DOM environment

---

## Deployment & CI/CD

### GitHub Actions

**Location**: `.github/workflows/`

#### Test Workflow (`test.yml`)
**Triggers**: Push to `develop`, all PRs

Jobs:
1. **test**: Run `bun run test`
2. **lint**: Run `bun run lint`

#### Production Workflow (`production.yml`)
**Triggers**: Push to `main`

Jobs (sequential):
1. **test**: Run tests
2. **migrate**: Apply Drizzle migrations
   - Requires: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
3. **deploy**: Build and deploy to Vercel
   - Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Environment Setup

**Production environment variables**:
- Database: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- API Updates: `UPDATES_USER`, `UPDATES_PASSWORD_HASH`
- Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Prebuild Hook

**Script**: `/home/user/gridtip/scripts/save-avatars.ts`

**Purpose**: Download user avatars from Google OAuth to local storage

**Execution**:
```json
"prebuild": "bun run scripts/save-avatars.ts"
```

**Process**:
1. Query all users with `image` URLs
2. Fetch images via `ofetch`
3. Save to `/public/img/user/{userId}.png`
4. Enables static generation and faster loading

---

## Common Tasks

### Adding a New Route

1. **Create route directory**:
   ```
   app/tipping/my-feature/
   ├── page.tsx
   ├── _components/
   └── actions/
   ```

2. **Add to navigation** (if needed):
   - Edit: `components/nav-main.tsx`
   - Add route to `items` array

3. **Add breadcrumb** (if needed):
   - Edit: `components/breadcrumbs.tsx`

### Adding a New Database Table

1. **Define schema** in `/home/user/gridtip/db/schema/schema.ts`:
   ```typescript
   export const myTable = sqliteTable('my_table', {
     id: text('id').primaryKey().$defaultFn(() => createId()),
     name: text('name').notNull(),
     createdAt: integer('created_at', { mode: 'timestamp' })
       .notNull()
       .$defaultFn(() => new Date()),
   })
   ```

2. **Generate migration**:
   ```bash
   bun run db:generate
   ```

3. **Review migration** in `db/migrations/`

4. **Apply migration**:
   ```bash
   bun run db:migrate
   ```

5. **Add to Drizzle queries** (optional):
   ```typescript
   // In db/index.ts
   export const db = drizzle(client, {
     schema: { ...authSchema, myTable },
   })
   ```

### Adding a New Server Action

1. **Create file** in `/actions/` or route-specific `actions/`:
   ```typescript
   'use server'

   import { z } from 'zod'
   import { verifySession } from '@/lib/dal'
   import { ServerResponse } from '@/types'

   const schema = z.object({
     // Define schema
   })

   export async function myAction(
     input: z.infer<typeof schema>
   ): Promise<ServerResponse> {
     const { user } = await verifySession()
     const validated = schema.parse(input)

     // Perform action

     return { ok: true, message: 'Success' }
   }
   ```

2. **Use in component**:
   ```typescript
   import { myAction } from '@/actions/my-action'

   const result = await myAction({ /* data */ })
   if (result.ok) {
     toast.success(result.message)
   }
   ```

### Adding a New shadcn/ui Component

```bash
# Install individual component
bunx shadcn@latest add [component-name]
```

**Example**:
```bash
bunx shadcn@latest add tabs
```

**Configuration**: `components.json`

### Invalidating Cache

```typescript
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'

// Invalidate specific tag
revalidateTag(CacheTag.Predictions)

// Clear multiple tags
revalidateTag(CacheTag.Results)
revalidateTag(CacheTag.Predictions)
```

### Updating F1 Data from Jolpica API

**Manual update via API routes**:
```bash
# Update races
curl -u username:password https://gridtip.joschua.io/api/races/update

# Update drivers
curl -u username:password https://gridtip.joschua.io/api/drivers/update

# Update constructors
curl -u username:password https://gridtip.joschua.io/api/constructors/update

# Update results
curl -u username:password https://gridtip.joschua.io/api/results/update
```

**Programmatic update**:
```typescript
// In server component or API route
const response = await fetch('https://gridtip.joschua.io/api/races/update', {
  headers: {
    Authorization: `Basic ${btoa(`${UPDATES_USER}:${UPDATES_PASSWORD}`)}`,
  },
})
```

---

## Important File References

### Core Configuration

| File | Purpose | Location |
|------|---------|----------|
| `package.json` | Dependencies & scripts | `/home/user/gridtip/package.json` |
| `tsconfig.json` | TypeScript config | `/home/user/gridtip/tsconfig.json` |
| `next.config.ts` | Next.js config | `/home/user/gridtip/next.config.ts` |
| `drizzle.config.ts` | Database config | `/home/user/gridtip/drizzle.config.ts` |
| `eslint.config.mjs` | Linting rules | `/home/user/gridtip/eslint.config.mjs` |
| `.prettierrc` | Code formatting | `/home/user/gridtip/.prettierrc` |
| `vitest.config.mts` | Test config | `/home/user/gridtip/vitest.config.mts` |
| `components.json` | shadcn config | `/home/user/gridtip/components.json` |

### Database

| File | Purpose | Location |
|------|---------|----------|
| `schema.ts` | Main schema | `/home/user/gridtip/db/schema/schema.ts` |
| `auth-schema.ts` | Auth schema | `/home/user/gridtip/db/schema/auth-schema.ts` |
| `index.ts` | DB client | `/home/user/gridtip/db/index.ts` |
| `migrations/` | Migration files | `/home/user/gridtip/db/migrations/` |

### Authentication

| File | Purpose | Location |
|------|---------|----------|
| `auth.ts` | Server auth config | `/home/user/gridtip/lib/auth.ts` |
| `auth-client.ts` | Client auth | `/home/user/gridtip/lib/auth-client.ts` |
| `dal.ts` | Data Access Layer | `/home/user/gridtip/lib/dal.ts` |
| `middleware.ts` | Route protection | `/home/user/gridtip/app/middleware.ts` |

### Constants

| File | Purpose | Location |
|------|---------|----------|
| `index.ts` | Core constants | `/home/user/gridtip/constants/index.ts` |
| `cache.ts` | Cache tags | `/home/user/gridtip/constants/cache.ts` |
| `icon-names.ts` | Group icons | `/home/user/gridtip/constants/icon-names.ts` |

### Utilities

| File | Purpose | Location |
|------|---------|----------|
| `utils.ts` | General utils (cn) | `/home/user/gridtip/lib/utils.ts` |
| `groups.ts` | Group utilities | `/home/user/gridtip/lib/utils/groups.ts` |
| `races.ts` | Race utilities | `/home/user/gridtip/lib/utils/races.ts` |
| `prediction-fields.ts` | Prediction utils | `/home/user/gridtip/lib/utils/prediction-fields.ts` |
| `country-flag.ts` | Flag utilities | `/home/user/gridtip/lib/utils/country-flag.ts` |

### API Routes

| File | Purpose | Location |
|------|---------|----------|
| `auth/[...all]/route.ts` | Auth endpoints | `/home/user/gridtip/app/api/auth/[...all]/route.ts` |
| `races/update/route.ts` | Update races | `/home/user/gridtip/app/api/races/update/route.ts` |
| `drivers/update/route.ts` | Update drivers | `/home/user/gridtip/app/api/drivers/update/route.ts` |
| `constructors/update/route.ts` | Update constructors | `/home/user/gridtip/app/api/constructors/update/route.ts` |
| `results/update/route.ts` | Update results | `/home/user/gridtip/app/api/results/update/route.ts` |
| `utils.ts` | API utilities | `/home/user/gridtip/app/api/utils.ts` |

### Main Pages

| Route | File Location |
|-------|---------------|
| `/` | `/home/user/gridtip/app/(public)/page.tsx` |
| `/auth` | `/home/user/gridtip/app/(standalone)/auth/page.tsx` |
| `/join/[groupId]` | `/home/user/gridtip/app/(standalone)/join/[groupId]/page.tsx` |
| `/tipping` | `/home/user/gridtip/app/tipping/page.tsx` |
| `/tipping/add-tips/[race-id]` | `/home/user/gridtip/app/tipping/add-tips/[race-id]/page.tsx` |
| `/tipping/championships` | `/home/user/gridtip/app/tipping/championships/page.tsx` |
| `/tipping/groups` | `/home/user/gridtip/app/tipping/groups/page.tsx` |
| `/tipping/group-admin` | `/home/user/gridtip/app/tipping/group-admin/page.tsx` |
| `/tipping/leaderboard` | `/home/user/gridtip/app/tipping/leaderboard/page.tsx` |
| `/tipping/settings` | `/home/user/gridtip/app/tipping/settings/page.tsx` |

### Key Components

| Component | Location |
|-----------|----------|
| App Sidebar | `/home/user/gridtip/components/app-sidebar.tsx` |
| App Header | `/home/user/gridtip/components/app-header.tsx` |
| Group Switcher | `/home/user/gridtip/components/group-switcher.tsx` |
| Driver Option | `/home/user/gridtip/components/driver-option.tsx` |
| Select Driver | `/home/user/gridtip/components/select-driver.tsx` |
| Breadcrumbs | `/home/user/gridtip/components/breadcrumbs.tsx` |
| UI Components | `/home/user/gridtip/components/ui/*` |

### Actions

| Action | Location |
|--------|----------|
| Create Group | `/home/user/gridtip/actions/create-group.ts` |
| Join Group | `/home/user/gridtip/actions/join-group.ts` |
| Edit Group | `/home/user/gridtip/actions/edit-group.ts` |
| Delete User | `/home/user/gridtip/actions/delete-user.ts` |

### Scripts

| Script | Location |
|--------|----------|
| Save Avatars | `/home/user/gridtip/scripts/save-avatars.ts` |

### Tests

| Test | Location |
|------|----------|
| Cutoff Tests | `/home/user/gridtip/__tests__/cutoff.test.ts` |

---

## Tips for AI Assistants

### When Making Changes

1. **Always check authentication** - Most routes require `verifySession()`
2. **Use proper cache tags** - Revalidate caches when data changes
3. **Follow server/client boundaries** - Mark client components with `'use client'`
4. **Validate with Zod** - All user inputs should be validated
5. **Return ServerResponse** - Server actions should return `{ ok, message }`
6. **Check cutoff logic** - Race tips have time-based cutoffs
7. **Test with sprint races** - Sprint weekends have different prediction fields
8. **Respect admin permissions** - Use `verifyIsAdmin()` for admin-only features

### When Debugging

1. **Check middleware** - Authentication issues often stem from middleware
2. **Verify cache tags** - Stale data might be cached
3. **Check database migrations** - Schema changes need migrations
4. **Review Zod schemas** - Validation errors might be from schema mismatches
5. **Check environment variables** - Missing vars cause auth/db failures
6. **Review DAL functions** - Session and permission logic centralized in DAL

### When Adding Features

1. **Use existing patterns** - Follow established patterns in codebase
2. **Colocate route-specific code** - Use `_components/`, `actions/`, `_utils/`
3. **Add cache tags** - For data that needs invalidation
4. **Update navigation** - Add to sidebar/breadcrumbs if needed
5. **Write tests** - Add to `__tests__/` directory
6. **Document constants** - Add to `/constants/` if reusable

---

## Related Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **better-auth**: https://better-auth.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Jolpica F1 API**: https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md
- **Turso Docs**: https://docs.turso.tech/

---

**Last Updated**: 2025-11-21
**Maintained By**: AI assistants working on GridTip

_This document is a living reference. Update it when significant architectural changes are made._
