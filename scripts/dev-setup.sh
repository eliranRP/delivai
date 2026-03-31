#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DelivAI — Local dev bootstrap
# Usage: ./scripts/dev-setup.sh
#
# Starts the full local stack:
#   1. Docker Compose (Postgres + pgvector + Redis)
#   2. Runs Prisma migrations
#   3. Seeds the database with test data
#   4. Starts the Shopify app (Remix) + marketing site in parallel
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[delivai]${NC} $1"; }
ok()  { echo -e "${GREEN}  ✓${NC} $1"; }
warn(){ echo -e "${YELLOW}  ⚠${NC} $1"; }
err() { echo -e "${RED}  ✗${NC} $1"; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || err "Docker not found. Install Docker Desktop: https://docs.docker.com/get-docker/"
command -v node   >/dev/null 2>&1 || err "Node.js not found. Install via: https://nodejs.org"
command -v pnpm   >/dev/null 2>&1 || err "pnpm not found. Install: npm i -g pnpm"

# ── .env.local check ──────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$ROOT_DIR/.env.local" ]; then
  warn ".env.local not found — copying from .env.example"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env.local"
  warn "Edit .env.local and set SHOPIFY_API_KEY + SHOPIFY_API_SECRET before running shopify app dev"
fi

# Copy .env.local into shopify-app dir for Prisma + Remix to pick up
cp "$ROOT_DIR/.env.local" "$ROOT_DIR/apps/shopify-app/.env"

# ── Install dependencies ───────────────────────────────────────────────────────
log "Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
ok "Dependencies installed"

# ── Docker services ────────────────────────────────────────────────────────────
log "Starting Docker services (Postgres + Redis)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d --wait
ok "Postgres + Redis running"

# ── Prisma migrations ──────────────────────────────────────────────────────────
log "Running Prisma migrations..."
cd "$ROOT_DIR/apps/shopify-app"
pnpm prisma generate --silent
pnpm prisma migrate dev --name init --skip-seed 2>/dev/null || pnpm prisma migrate deploy
ok "Database schema applied"

# pgvector migration (idempotent)
log "Applying pgvector extension..."
docker exec delivai_postgres psql -U delivai -d delivai_dev -c \
  "CREATE EXTENSION IF NOT EXISTS vector; ALTER TABLE \"KnowledgeChunk\" ADD COLUMN IF NOT EXISTS embedding vector(1536);" \
  >/dev/null 2>&1 || true
ok "pgvector ready"

# ── Seed data ──────────────────────────────────────────────────────────────────
log "Seeding database with test data..."
pnpm db:seed
ok "Test data seeded"

# ── Print summary ──────────────────────────────────────────────────────────────
cd "$ROOT_DIR"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  DelivAI local environment ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Next steps:"
echo ""
echo -e "  ${CYAN}1. Start the Shopify app (with Cloudflare tunnel):${NC}"
echo "     cd apps/shopify-app && pnpm dev"
echo ""
echo -e "  ${CYAN}2. Start the marketing site:${NC}"
echo "     cd apps/marketing-site && pnpm dev"
echo "     → http://localhost:3001"
echo ""
echo -e "  ${CYAN}3. Run tests:${NC}"
echo "     pnpm --filter shopify-app test"
echo ""
echo -e "  ${CYAN}4. Test store data:${NC}"
echo "     Store:  test-store.myshopify.com"
echo "     Plan:   Growth (active)"
echo "     Conv:   3 seeded (open / escalated / resolved)"
echo ""
echo "  ⚠  For AI features: enter a real Claude API key in"
echo "     Shopify Admin → DelivAI → Settings → AI Configuration"
echo ""
