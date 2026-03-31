#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DelivAI — Production deploy script
# Prerequisites:
#   - railway CLI installed and logged in (npm i -g @railway/cli && railway login)
#   - vercel CLI installed (npm i -g vercel)
#   - DATABASE_URL set in environment (Supabase connection string)
#   - SHOPIFY_API_KEY + SHOPIFY_API_SECRET set in environment
# Usage: ./scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()  { echo -e "${GREEN}  ✓${NC} $1"; }
warn(){ echo -e "${YELLOW}  ⚠${NC} $1"; }
err() { echo -e "${RED}  ✗${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Verify required tools ─────────────────────────────────────────────────────
command -v railway >/dev/null 2>&1 || err "railway CLI not found. Run: npm i -g @railway/cli"
command -v vercel  >/dev/null 2>&1 || err "vercel CLI not found. Run: npm i -g vercel"

# ── Required env vars ─────────────────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL must be set (Supabase connection string)}"
: "${SHOPIFY_API_KEY:?SHOPIFY_API_KEY must be set}"
: "${SHOPIFY_API_SECRET:?SHOPIFY_API_SECRET must be set}"

# ── Build shared types ────────────────────────────────────────────────────────
log "Building shared types..."
cd "$ROOT_DIR"
pnpm --filter @delivai/shared-types build
ok "Shared types built"

# ── Run migrations ────────────────────────────────────────────────────────────
log "Running Prisma migrations against production DB..."
cd "$ROOT_DIR/apps/shopify-app"
pnpm prisma migrate deploy
ok "Migrations applied"

# ── Deploy Shopify app to Railway ─────────────────────────────────────────────
log "Deploying Shopify app to Railway..."
cd "$ROOT_DIR"

ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(openssl rand -hex 32)}"
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}"

railway variables set \
  NODE_ENV=production \
  DATABASE_URL="$DATABASE_URL" \
  SHOPIFY_API_KEY="$SHOPIFY_API_KEY" \
  SHOPIFY_API_SECRET="$SHOPIFY_API_SECRET" \
  ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  SESSION_SECRET="$SESSION_SECRET" \
  ${REDIS_URL:+REDIS_URL="$REDIS_URL"} \
  ${REDIS_TOKEN:+REDIS_TOKEN="$REDIS_TOKEN"} \
  ${SENTRY_DSN:+SENTRY_DSN="$SENTRY_DSN"} \
  ${OPENAI_API_KEY:+OPENAI_API_KEY="$OPENAI_API_KEY"} \
  2>/dev/null || true

railway up --detach
ok "Shopify app deployed to Railway"

# Get Railway URL
RAILWAY_URL=$(railway domain 2>/dev/null || echo "check Railway dashboard")
log "Railway URL: $RAILWAY_URL"

# Update SHOPIFY_APP_URL
if [[ "$RAILWAY_URL" != "check Railway dashboard" ]]; then
  railway variables set SHOPIFY_APP_URL="https://$RAILWAY_URL"
  ok "SHOPIFY_APP_URL updated to https://$RAILWAY_URL"
fi

# ── Deploy marketing site to Vercel ───────────────────────────────────────────
log "Deploying marketing site to Vercel..."
cd "$ROOT_DIR/apps/marketing-site"
vercel --prod --yes 2>/dev/null
ok "Marketing site deployed to Vercel"

# ── Health check ──────────────────────────────────────────────────────────────
if [[ "$RAILWAY_URL" != "check Railway dashboard" ]]; then
  log "Health check..."
  sleep 10
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$RAILWAY_URL/health" || echo "000")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    ok "Health check passed (HTTP 200)"
  else
    warn "Health check returned HTTP $HTTP_STATUS — check Railway logs: railway logs"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  DelivAI deployed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Shopify App:    https://$RAILWAY_URL"
echo "  Marketing Site: check Vercel dashboard"
echo "  Health:         https://$RAILWAY_URL/health"
echo ""
echo "  Next steps:"
echo "  1. Update Shopify Partner Dashboard app URL to https://$RAILWAY_URL"
echo "  2. Add redirect URL: https://$RAILWAY_URL/auth/callback"
echo "  3. Install on your dev store and test the full flow"
echo "  4. Enter your Claude API key in DelivAI Settings"
echo ""
echo "  Logs: railway logs --tail"
echo ""
