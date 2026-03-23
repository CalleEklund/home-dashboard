# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Vite dev server (localhost:5173)
pnpm server     # NestJS server (localhost:3001)
pnpm build      # TypeScript type-check + Vite production build
pnpm lint       # ESLint (flat config) across client
```

Run both `pnpm dev` and `pnpm server` for full functionality (ICA widget needs the server). Run workspace-specific commands with `pnpm --filter <package> <script>`.

## Architecture

pnpm workspaces monorepo. Kiosk-mode dashboard for a Raspberry Pi touchscreen.

```
apps/
  client/       → React 19 + Vite + Tailwind 3 + dnd-kit (the dashboard)
  server/       → NestJS API server (hexagonal architecture, proxies external APIs)
packages/
  typescript-config/  → shared tsconfigs (base.json, react-app.json, node.json)
  eslint-config/      → shared ESLint flat config (react.js)
```

### Server (hexagonal architecture)

NestJS with ports & adapters pattern. Each integration module follows:
```
src/<module>/
  domain/entities/       → pure domain models
  domain/ports/          → abstract port classes (interfaces)
  application/           → services (use cases, depend only on ports)
  infrastructure/
    adapters/            → port implementations (external API calls)
    controllers/         → NestJS HTTP controllers
  <module>.module.ts     → wires adapters to ports via DI
```

Ports are abstract classes so NestJS DI can inject them. The module binds `{ provide: PortClass, useClass: AdapterClass }`.

The server proxies external APIs that can't be called directly from the browser due to CORS (e.g. ICA API).

### Widget registry pattern

Central registry in `src/registry.ts` maps widget IDs to components and metadata. All grid, drag, resize, picker, and lock screen logic is driven by this registry.

**To add a widget:**
1. Create `src/components/widgets/YourWidget.tsx` (self-contained, no required props)
2. Add the ID to the `WidgetId` union in `src/types.ts`
3. Add an entry in `src/registry.ts` with label, icon, component, and defaultSpan

### Grid system

8-column × 9-row CSS grid (`src/constants.ts`). Widgets have explicit `colStart`/`rowStart`/`colSpan`/`rowSpan` positions. `src/lib/grid.ts` has pure collision detection and free-cell-finding functions — no React, no state.

### State flow

- `useLayout` hook owns all layout mutations (move, resize, add, remove, toggle lock screen, reset). Persists to `localStorage` key `fridge_layout`.
- `useLockScreen` hook handles inactivity timeout and lock/unlock. Timeout persisted to `fridge_lock_timeout`.
- `App.tsx` wires hooks to components. Dashboard and Toolbar receive callbacks as props.
- Widget components are self-contained: they manage their own data (e.g. Notes reads/writes `fridge_notes` directly).

### Drag and drop

Uses `@dnd-kit/core` with `PointerSensor` (not HTML5 backend) for touch compatibility. Grid cells are droppables, widgets are draggables. Dragging is only enabled in edit mode.

## Styling

Catppuccin Mocha palette via Tailwind arbitrary values — no custom theme tokens defined. Key colors: background `#181825`, surface `#1e1e2e`, input `#313244`, accent blue `#89b4fa`, red `#f38ba8`, orange `#fab387`.

## TypeScript

`verbatimModuleSyntax` is enabled — use `import type` for type-only imports. The tsconfig uses project references (`tsconfig.app.json` for src, `tsconfig.node.json` for vite config), both extending shared configs from `@smartfridge/typescript-config`.
