FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/api-schema/package.json packages/api-schema/
RUN pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/server/ apps/server/
RUN pnpm --filter @home-dashboard/server build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
