FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/server ./apps/server

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter common build
RUN pnpm --filter server build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
