# @smartfridge/client

React dashboard for a kiosk-mode touchscreen. Built with Vite, Tailwind CSS (Catppuccin Mocha theme), and TanStack Query.

## Architecture

Feature-based structure inspired by domain-driven design:

```
src/
  App.tsx              Entry point, wires pages/lock screen/toolbar
  main.tsx             React root + QueryClientProvider
  features/            Self-contained widget modules
    calendar/          ICS calendar with timeline/list views
    ica-shopping/      ICA grocery list with BankID login
    departures/        SL real-time transit departures
    clock/             Time and date display
    weather/           Current weather from Open-Meteo
    notes/             Tabbed note lists (localStorage)
    timer/             Countdown timer with alarm
    weekly-planner/    Recurring weekly task board
  kernel/              Shared infrastructure
    api/               openapi-fetch client + openapi-react-query
    grid/              Grid constants, collision detection
    hooks/             usePages, useLockLayout, useLockScreen
    types.ts           WidgetId, WidgetLayout, Registry
    registry.ts        Widget ID to component mapping
  ui/
    components/        Dashboard, Toolbar, LockScreen, WidgetPicker, ResizeControls
```

### Feature Module Pattern

Complex features follow a consistent structure:

```
<feature>/
  index.ts             Barrel export (default component)
  types.ts             Feature-specific types (or re-exported from @smartfridge/api-schema)
  api.ts               TanStack Query hooks (useQuery/useMutation via openapi-react-query)
  helpers.ts           Pure utility functions
  hooks/               Custom React hooks (state management)
  views/               Presentational components
  components/          Self-contained sub-components
```

Simple features (clock, weather) have just `index.ts` + `components/`.

### Type-Safe API Client

End-to-end type safety from server Zod schemas to client API calls:

1. Server generates `open-api-spec.json` via `@nestjs/swagger`
2. `packages/api-schema` runs `openapi-typescript` to generate typed `paths` interface
3. Client imports types from `@smartfridge/api-schema`
4. `kernel/api/client.ts` creates a typed `openapi-fetch` client + `openapi-react-query` wrapper
5. Features use `api.useQuery("get", "/api/calendar/events")` — fully typed endpoint, params, and response

### Grid System

20-column x 21-row CSS grid. Widgets have explicit `colStart`/`rowStart`/`colSpan`/`rowSpan` positions. Drag-and-drop via `@dnd-kit/core` with `PointerSensor` for touch compatibility.

### Multi-Page Dashboard

Multiple dashboard pages stored in localStorage. Swipe between pages (CSS scroll-snap) or use page tabs in edit mode. Each page has an independent widget layout. Lock screen has its own separate layout.

## External Dependencies

| Dependency | Purpose |
|-----------|---------|
| `react` 19 | UI framework |
| `@dnd-kit/core` | Drag-and-drop for widget positioning |
| `@tanstack/react-query` | Server state management and caching |
| `openapi-fetch` | Type-safe fetch client from OpenAPI spec |
| `openapi-react-query` | TanStack Query integration with openapi-fetch |
| `tailwindcss` 3 | Utility-first CSS (Catppuccin Mocha palette) |
| `vite` 7 | Build tool and dev server |

## Setup

```bash
# Development
pnpm dev              # Vite on localhost:5173

# Build
pnpm build            # TypeScript check + Vite production build

# Lint
pnpm lint             # ESLint with Tailwind checks
```

Requires the server running on `localhost:3001` for API-dependent widgets (ICA, Calendar).

## Styling

Catppuccin Mocha palette via Tailwind arbitrary values. Key colors:

| Color | Hex | Usage |
|-------|-----|-------|
| Base | `#181825` | Page background |
| Surface | `#1e1e2e` | Widget background |
| Overlay | `#313244` | Inputs, cards |
| Blue | `#89b4fa` | Accent, active states |
| Red | `#f38ba8` | Delete, errors |
| Peach | `#fab387` | Warnings, lock screen edit |
| Text | `#cdd6f4` | Primary text |
| Subtext | `#a6adc8` | Secondary text |
| Overlay2 | `#6c7086` | Muted text, placeholders |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | Toggle toolbar visibility |
