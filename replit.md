# Nexamove — Hyperlocal Delivery App

## Overview

pnpm workspace monorepo using TypeScript. Nexamove is a hyperlocal delivery web app (Zomato/Swiggy-inspired) for Niamathpur, Lala, Hailakandi, Assam.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS v4 (artifact: `artifacts/nexamove`, path `/`)
- **API framework**: Express 5 + Socket.io (artifact: `artifacts/api-server`, path `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Maps**: Leaflet + OpenStreetMap (NO Google Maps)
- **Auth**: JWT (stored in localStorage as `nexamove_token`) + bcrypt

## Default Coordinates
- Niamathpur, Hailakandi, Assam: `24.540340, 92.588568`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Codegen Warning
Do NOT re-run codegen without also re-writing `lib/api-zod/src/index.ts` — orval overwrites it and creates a duplicate export error. After codegen, restore:
```ts
export * from "./generated/api/api";
```

## Auth Flow
- `setAuthTokenGetter(() => localStorage.getItem("nexamove_token"))` is called in `App.tsx` at module load — all API calls automatically include the JWT bearer token.
- Auth context in `lib/auth.tsx` manages user state + localStorage persistence.

## Socket.io
- Server path: `/api/socket.io`
- Client connects via `connectSocket(token)` from `lib/socket.ts`
- Riders emit `rider-location-update` events; customers receive `rider-location` + `order-update` events per order room.

## DB Tables
- `users` — customers and riders (JWT auth with bcrypt)
- `shops` — 5 seeded shops near default coords
- `riders` — linked to users with role=rider, stores live lat/lng
- `orders` — links customer → shop → rider, status: preparing/on_the_way/delivered

## Pages
- `/login` — Login
- `/register` — Register (customer or rider)
- `/home` — Map + shop grid + radius selector + order button
- `/orders` — Active orders with live Socket.io map tracking + status stepper; past orders
- `/profile` — User info + logout
- `/search` — Search shops by name/category

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## GitHub Push Note
GitHub OAuth integration was dismissed twice. To push to GitHub in the future:
- Try the GitHub integration again via Replit integrations, OR
- Ask the user for a GitHub Personal Access Token (store as secret `GITHUB_TOKEN`) and the target repo URL, then use `git remote set-url origin https://<token>@github.com/<user>/<repo>.git && git push -u origin main`
