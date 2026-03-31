# DelivAI — MVP Production Deployment Plan

**Total estimated cost: ~$5–10/month**
**Time to deploy: ~45 minutes**

---

## Cost Breakdown

| Service | Plan | Monthly Cost | What it hosts |
|---------|------|-------------|---------------|
| [Railway](https://railway.app) | Hobby ($5/mo + usage) | ~$5–8 | Shopify App (Remix + Node.js) |
| [Supabase](https://supabase.com) | Free tier | $0 | PostgreSQL + pgvector |
| [Vercel](https://vercel.com) | Free tier | $0 | Marketing site (Next.js) |
| [Upstash](https://upstash.com) | Free tier (10k req/day) | $0 | Redis (rate limiting) |
| **Total** | | **~$5–8/mo** | |

> **Why not Fly.io free tier?** Fly.io's free VMs (256MB RAM) are too small for Node.js + Remix in production. Railway Hobby gives you 512MB+ with auto-sleep off.

---

## Step 1 — Database: Supabase (Free)

```bash
# 1. Create account at supabase.com → New Project
# 2. Note your connection string: Settings → Database → URI
# 3. Enable pgvector:
#    Go to SQL Editor → run:
CREATE EXTENSION IF NOT EXISTS vector;

# 4. Set your DATABASE_URL (replace with your actual values):
export DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

Then run migrations against Supabase:
```bash
cd apps/shopify-app
DATABASE_URL="your_supabase_url" pnpm prisma migrate deploy
```

Apply pgvector column + index:
```sql
-- Run in Supabase SQL Editor:
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_idx
  ON "KnowledgeChunk" USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Step 2 — Redis: Upstash (Free)

```bash
# 1. Create account at upstash.com → Create Database → Redis
# 2. Copy REST URL and Token from dashboard
# 3. Note these — you'll set them as Railway env vars in Step 4
```

---

## Step 3 — Shopify App: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init --name delivai-shopify-app

# Link repo
railway link

# Set environment variables (all required):
railway variables set \
  NODE_ENV=production \
  DATABASE_URL="your_supabase_url" \
  SHOPIFY_API_KEY="your_shopify_api_key" \
  SHOPIFY_API_SECRET="your_shopify_api_secret" \
  SHOPIFY_APP_URL="https://delivai-shopify-app.up.railway.app" \
  ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  REDIS_URL="your_upstash_redis_url" \
  REDIS_TOKEN="your_upstash_redis_token"

# Deploy
railway up --detach

# Get your deployment URL
railway domain
```

After deploy, note the Railway URL (e.g. `https://delivai-shopify-app.up.railway.app`).

---

## Step 4 — Update Shopify App URL

```bash
# Update the SHOPIFY_APP_URL to match your Railway domain:
railway variables set SHOPIFY_APP_URL="https://delivai-shopify-app.up.railway.app"

# Also update shopify.app.toml in your repo:
# application_url = "https://delivai-shopify-app.up.railway.app"
# Then redeploy: railway up
```

In Shopify Partner Dashboard:
1. Go to your app → Configuration
2. Update App URL to your Railway URL
3. Add redirect URL: `https://delivai-shopify-app.up.railway.app/auth/callback`

---

## Step 5 — Marketing Site: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from marketing-site directory
cd apps/marketing-site
vercel --prod

# Set environment variable (if any):
vercel env add NEXT_PUBLIC_APP_URL production
# Value: https://delivai-shopify-app.up.railway.app
```

Or connect via Vercel dashboard (github.com → Import Project → apps/marketing-site).

---

## Step 6 — Health Check

```bash
# Verify the app is running:
curl https://delivai-shopify-app.up.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}

# Check logs:
railway logs --tail
```

---

## Step 7 — Install the App on Your Test Store

1. Go to Shopify Partner Dashboard → Your App → Test on development store
2. Install on your development store
3. In DelivAI Settings → AI Configuration, enter your Claude API key
4. In Shopify Admin → Online Store → Themes → Customize → App Embeds → enable DelivAI Chat
5. Visit your storefront and open the chat widget

---

## Upgrading for Production Traffic

When you start getting real users, upgrade in this order:

| Traffic | Upgrade |
|---------|---------|
| 0–50 stores | Railway Hobby ($5/mo) — current plan |
| 50–500 stores | Railway Pro ($20/mo) + Supabase Pro ($25/mo) |
| 500+ stores | Fly.io multi-region + Supabase Pro + Upstash Pay-as-you-go |

---

## Environment Variables Reference

| Variable | Where to get it | Required |
|----------|----------------|----------|
| `DATABASE_URL` | Supabase → Settings → Database → URI | ✓ |
| `SHOPIFY_API_KEY` | Shopify Partners → App → API credentials | ✓ |
| `SHOPIFY_API_SECRET` | Shopify Partners → App → API credentials | ✓ |
| `SHOPIFY_APP_URL` | Your Railway deployment URL | ✓ |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` | ✓ |
| `SESSION_SECRET` | `openssl rand -hex 32` | ✓ |
| `REDIS_URL` | Upstash dashboard | Optional |
| `REDIS_TOKEN` | Upstash dashboard | Optional |
| `SENTRY_DSN` | sentry.io → New Project | Optional |
| `OPENAI_API_KEY` | platform.openai.com | Optional (for embeddings) |

---

## One-liner Deploy Sequence

```bash
# From repo root — after completing Steps 1–2:
./scripts/deploy.sh
```

See `scripts/deploy.sh` for the automated version.
