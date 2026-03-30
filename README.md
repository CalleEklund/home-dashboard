# SmartFridge

A customizable dashboard web app deployed on [Railway](https://railway.app). Built as a pnpm workspaces monorepo with a React frontend and NestJS backend.

## Features

### Widgets
- **Clock** — large time and date display
- **Weather** — current temperature and conditions (Open-Meteo API)
- **Notes** — tabbed note lists with create, rename, and delete
- **Departures** — real-time public transit departures (SL Realtids-API, Stockholm)
- **ICA Shopping** — synced grocery lists via the ICA API, with automated BankID login
- **Calendar** — merged multi-person calendar from Google Calendar ICS feeds, with day/week/month views in both list and timeline modes, event detail popup on tap
- **Timer** — countdown timer with presets, custom input, pause/resume, and audio alarm
- **Weekly Planner** — recurring task board across weekdays with configurable recurrence (weekly, biweekly, every 3 weeks, monthly)

### Dashboard
- **Multi-page** — create multiple dashboard pages, swipe between them
- **Drag-and-drop grid** — 20-column responsive grid, drag to reposition, resize with controls
- **Customizable lock screen** — independent widget grid shown after inactivity timeout
- **Widget picker** — add/remove widgets per page
- **Toolbar** — hidden by default, toggle with `Ctrl+E`

### Type Safety
- **OpenAPI pipeline** — server generates `open-api-spec.json` on startup, `openapi-typescript` generates typed `paths` interface, client uses `openapi-fetch` + `openapi-react-query` for end-to-end type-safe API calls
- **Zod validation** — request/response schemas validated at runtime via `@qte/nest-border-patrol`

## Project Structure

```
apps/
  client/       React 19 + Vite + Tailwind + TanStack Query
  server/       NestJS API server (hexagonal architecture)
packages/
  api-schema/   Generated TypeScript types from OpenAPI spec
  typescript-config/   Shared tsconfigs
  eslint-config/       Shared ESLint flat config
infrastructure/
  local/        Docker Compose (headless Chrome for BankID)
```

## Quick Start

```bash
pnpm install
pnpm docker:up       # start headless Chrome (needed for ICA BankID login)
pnpm server          # NestJS on localhost:3001
pnpm client          # Vite dev server on localhost:5173
```

## Deployment

The app is deployed on **Railway** as two services:

- **Client** — static Vite build served by the NestJS server (or a standalone static host)
- **Server** — NestJS API server

Railway auto-deploys from the `main` branch. Each service uses its own build/start commands configured in Railway's dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm client` | Start Vite dev server |
| `pnpm server` | Start NestJS dev server (watch mode) |
| `pnpm build` | Build api-schema types + client |
| `pnpm generate` | Regenerate TypeScript types from OpenAPI spec |
| `pnpm lint` | ESLint with Tailwind checks |
| `pnpm docker:up` | Start Docker services (headless Chrome) |
| `pnpm docker:down` | Stop Docker services |
