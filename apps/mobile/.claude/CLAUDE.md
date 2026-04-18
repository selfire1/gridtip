# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

GridTip Mobile — a React Native (Expo) app for submitting F1 race predictions (tips). Users authenticate via the GridTip web app, then pick drivers/constructors for upcoming races within their groups.

## Commands

- `bun install` — install dependencies
- `bun run start` — start Expo dev server (development mode)
- `bun run dev` — build and run on a connected iOS device (development mode)
- `bun run build` — build and run on iOS
- `bun run prebuild` — regenerate native iOS project
- `bun run lint` — run ESLint

## TypeScript Conventions

- Always use `type` instead of `interface` for type definitions
- Always use closures instead of single line returns
- Path aliases: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`

## Architecture

**Routing**: Expo Router with file-based routing. All routes live under `src/app/`. The root layout (`src/app/_layout.tsx`) wraps the app in theme, session, and splash screen providers.

**Auth flow**: Token-based. The sign-in screen (`src/app/auth/sign-in/`) opens the GridTip web app via `expo-web-browser` for OAuth. On success, the web app redirects back with a deep link (`gridtip://set-token/[token]`). The token is stored in `expo-secure-store` and managed through `SessionProvider` (`src/lib/ctx.tsx`). The `(app)` route group redirects to sign-in if no session exists.

**API client**: `src/lib/api.ts` — a thin `fetch` wrapper that attaches the bearer token. The base URL comes from `expo-constants` extra config, switching between localhost (dev) and production.

**UI components**: `src/components/ui/` contains shadcn/ui-style components built with `@rn-primitives`, NativeWind (TailwindCSS), and `class-variance-authority`. The theme uses CSS custom properties (HSL) defined in `assets/global.css`.

**Navigation**: Native tab bar via `expo-router/unstable-native-tabs` with two tabs: Home and Other.

**Domain types**: `src/types.ts` defines `Race`, `Driver`, `Constructor`, `Group`, etc.
