FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/client/package.json apps/client/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/api-schema/ packages/api-schema/
RUN pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/client/ apps/client/
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @home-dashboard/client build

FROM nginx:alpine
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
