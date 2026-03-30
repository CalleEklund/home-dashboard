# @home-dashboard/server

NestJS API server that proxies external APIs and serves data to the client.

## Architecture

Hexagonal architecture (ports & adapters) with NestJS dependency injection. Each module follows:

```
src/<module>/
  entities/       Domain models
  ports/          Abstract port classes (interfaces)
  services/       Application services (use cases, depend only on ports)
  adapters/       Port implementations (external API calls, file I/O)
  http/           NestJS HTTP controllers
  schemas/        Zod schemas for request/response validation
  mappers/        Domain entity to HTTP response transformations
  <module>.module.ts   Wires adapters to ports via DI
```

Ports are abstract classes so NestJS DI can inject them. Each module binds `{ provide: PortClass, useClass: AdapterClass }`.

### Modules

- **ICA** — shopping list integration via `apimgw-pub.ica.se`. Authentication automated via Puppeteer (headless Chrome navigates ica.se BankID login, extracts session cookie). Auto-refreshes Bearer token from `thSessionId` cookie.
- **Calendar** — fetches and caches ICS feeds from Google Calendar. Parses with `node-ical`, expands recurring events (RRULE), serves merged events. Feed configs stored in `data/calendar-feeds.json`.

### Request/Response Validation

Uses `@qte/nest-border-patrol` with Zod schemas:
- `HttpBorder` defines request body, path/query parameters, and response schemas
- `@UseHttpBorder()` decorator auto-generates Swagger docs and validates at runtime
- `InferFromHttpBorder` provides full TypeScript inference for handler signatures
- `border.createResponse()` validates response data before sending

### OpenAPI Spec Generation

On startup, `@nestjs/swagger` generates `open-api-spec.json` and writes it to `packages/api-schema/`. This is consumed by `openapi-typescript` to generate typed client interfaces.

## External Dependencies

| Dependency | Purpose |
|-----------|---------|
| `puppeteer-core` | Automates BankID login flow via headless Chrome |
| `node-ical` | Parses ICS calendar feeds, expands recurring events |
| `@nestjs/swagger` | OpenAPI spec generation |
| `@qte/nest-border-patrol` | Zod-based request/response validation + Swagger integration |
| `zod` | Schema definitions for validation |

### Docker Services

- **Headless Chrome** (`ghcr.io/browserless/chromium` on port 3002) — required for ICA BankID authentication. The server connects via WebSocket (`ws://localhost:3002`).

## Setup

```bash
# Start headless Chrome
pnpm docker:up

# Development (watch mode)
pnpm dev

# Build
pnpm build

# Start production
pnpm start
```

Runs on `localhost:3001`. CORS is enabled for all origins.

## Data Storage

- `data/calendar-feeds.json` — calendar feed configs (gitignored, contains secret ICS URLs)
- ICA session tokens — held in memory only, lost on restart
