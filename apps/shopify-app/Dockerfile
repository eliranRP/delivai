FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install pnpm/turbo globally
RUN npm install -g pnpm@9

# ── deps ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/shopify-app/package.json ./apps/shopify-app/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --filter shopify-app...

# ── build ──
FROM deps AS builder
COPY . .
RUN pnpm --filter shared-types build
RUN pnpm --filter shopify-app exec prisma generate
RUN pnpm --filter shopify-app build

# ── production image ──
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/shopify-app/build ./apps/shopify-app/build
COPY --from=builder /app/apps/shopify-app/node_modules ./apps/shopify-app/node_modules
COPY --from=builder /app/apps/shopify-app/prisma ./apps/shopify-app/prisma
COPY --from=builder /app/apps/shopify-app/public ./apps/shopify-app/public
COPY --from=builder /app/apps/shopify-app/extensions ./apps/shopify-app/extensions
COPY --from=builder /app/apps/shopify-app/package.json ./apps/shopify-app/

WORKDIR /app/apps/shopify-app

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && npx remix-serve ./build/server/index.js"]
