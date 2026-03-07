# ============================================================
# Dockerfile — unified multi-stage build for admin & user apps
# Build context: project root (monorepo)
#
# Usage:
#   docker build --build-arg APP_NAME=admin --target runner-admin .
#   docker build --build-arg APP_NAME=user  --target runner-user  .
# ============================================================

# ---- base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- deps ----
FROM base AS deps
ARG APP_NAME
COPY package.json package-lock.json turbo.json ./
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
COPY packages/database/package.json ./packages/database/
COPY packages/ui/package.json ./packages/ui/
# Prisma schema must exist before npm ci (postinstall triggers prisma generate)
COPY packages/database/prisma ./packages/database/prisma
RUN npm ci

# ---- build ----
FROM base AS build
ARG APP_NAME
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY packages/database ./packages/database
COPY packages/ui ./packages/ui
COPY apps/${APP_NAME} ./apps/${APP_NAME}
COPY package.json turbo.json ./

# Rebuild Prisma Client in build stage
RUN cd packages/database && npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN npm run build --workspace=@repo/${APP_NAME}

# ---- runner-admin ----
FROM node:20-alpine AS runner-admin
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/database ./packages/database
COPY --from=build /app/packages/ui ./packages/ui
COPY --from=build /app/apps/admin/.next ./apps/admin/.next
COPY --from=build /app/apps/admin/public ./apps/admin/public
COPY --from=build /app/apps/admin/next.config.ts ./apps/admin/next.config.ts
COPY --from=build /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=build /app/apps/admin/middleware.ts ./apps/admin/middleware.ts
COPY --from=build /app/apps/admin/auth.ts ./apps/admin/auth.ts
COPY --from=build /app/apps/admin/auth.config.ts ./apps/admin/auth.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/turbo.json ./turbo.json

USER nextjs
EXPOSE 3000

WORKDIR /app/apps/admin
CMD ["npx", "next", "start"]

# ---- runner-user ----
# standalone 不可（tsx + カスタムサーバー）のため node_modules 込み
FROM node:20-alpine AS runner-user
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/database ./packages/database
COPY --from=build /app/packages/ui ./packages/ui
COPY --from=build /app/apps/user/.next ./apps/user/.next
COPY --from=build /app/apps/user/public ./apps/user/public
COPY --from=build /app/apps/user/server.ts ./apps/user/server.ts
COPY --from=build /app/apps/user/src ./apps/user/src
COPY --from=build /app/apps/user/next.config.ts ./apps/user/next.config.ts
COPY --from=build /app/apps/user/tsconfig.json ./apps/user/tsconfig.json
COPY --from=build /app/apps/user/package.json ./apps/user/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/turbo.json ./turbo.json

USER nextjs
EXPOSE 3001

WORKDIR /app/apps/user
CMD ["node", "--import", "tsx", "server.ts"]
