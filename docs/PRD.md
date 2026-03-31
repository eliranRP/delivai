# DelivAI — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-29
**Status:** Ready for development

---

## 1. Executive Summary

DelivAI is a multi-tenant AI-powered customer support SaaS for Shopify merchants, distributed as a Shopify App Store listing. It automatically resolves 80%+ of delivery-related customer support tickets through an AI agent (Claude Sonnet 4.6) embedded as a chat widget on the merchant's storefront. Unresolved issues escalate to a human help desk inbox inside Shopify Admin.

**Business model:** Monthly subscription (Starter $29 / Growth $79 / Scale $199), BYOK (merchants supply their own Claude API key), 14-day free trial.

---

## 2. Problem Statement

Shopify merchants spend 60–70% of their support time answering the same delivery questions:
- "Where is my order?"
- "My package didn't arrive."
- "I need to cancel / return / rebook."

Existing solutions (Gorgias, Zendesk) require significant setup time, charge per seat, and don't proactively take actions — they only help agents respond faster. DelivAI's AI agent *resolves* tickets autonomously, not just assists humans.

---

## 3. Target Users

| Persona | Description | Key Pain |
|---------|-------------|----------|
| **Merchant (Admin)** | Shopify store owner, 100–10,000 orders/month | Drowning in support tickets; can't afford a full support team |
| **Support Agent** | Part-time or full-time rep managing tickets | Context-switching between Shopify and email; no AI assistance |
| **End Customer** | Shopper with a delivery question | Can't get answers at 11 PM; hold times too long |

---

## 4. User Stories

### 4.1 Merchant / Admin

| ID | Story | Priority |
|----|-------|----------|
| M-01 | As a merchant, I can install DelivAI from the Shopify App Store in under 5 minutes | P0 |
| M-02 | As a merchant, I can enter my own Claude API key so I control AI costs | P0 |
| M-03 | As a merchant, I can customize the chat widget color, position, and greeting message | P1 |
| M-04 | As a merchant, I can set the AI persona name (default: "Aria") | P1 |
| M-05 | As a merchant, I can view all conversations in an inbox and reply or resolve them | P0 |
| M-06 | As a merchant, I can see analytics: resolved %, avg response time, top issue categories | P1 |
| M-07 | As a merchant, I can connect my EasyPost API key for delivery rebook functionality | P1 |
| M-08 | As a merchant, I can manage my subscription plan and view monthly conversation usage | P0 |
| M-09 | As a merchant, I can add knowledge base articles to improve AI accuracy | P2 |
| M-10 | As a merchant, I can set the AI escalation threshold (confidence below X → human) | P2 |

### 4.2 Support Agent

| ID | Story | Priority |
|----|-------|----------|
| A-01 | As an agent, I can see all escalated conversations in a prioritized inbox | P0 |
| A-02 | As an agent, I can see the full AI conversation history before taking over | P0 |
| A-03 | As an agent, I can reply directly to the customer from the inbox | P0 |
| A-04 | As an agent, I can use macros (canned responses) for common replies | P1 |
| A-05 | As an agent, I can assign conversations to colleagues | P1 |
| A-06 | As an agent, I can mark conversations as resolved, pending, or closed | P0 |
| A-07 | As an agent, I can see the customer's order details in a sidebar | P0 |

### 4.3 End Customer

| ID | Story | Priority |
|----|-------|----------|
| C-01 | As a customer, I can open a chat widget on the storefront to ask delivery questions | P0 |
| C-02 | As a customer, I get real-time AI responses that know my order status | P0 |
| C-03 | As a customer, I can cancel my unfulfilled order through chat | P1 |
| C-04 | As a customer, I can initiate a refund through chat | P1 |
| C-05 | As a customer, I can rebook a failed delivery to a new address through chat | P1 |
| C-06 | As a customer, I get seamlessly transferred to a human agent when needed | P0 |
| C-07 | As a customer, I can use the widget on mobile | P0 |

---

## 5. Functional Requirements

### 5.1 Shopify App Installation

- OAuth 2.0 authentication via Shopify App Bridge
- Session stored in PostgreSQL (Prisma session storage)
- `afterAuth` hook: upsert Store record, create default AIConfig
- GDPR webhooks (mandatory 4):
  - `customers/data_request` → return stored customer data
  - `customers/redact` → delete customer PII
  - `shop/redact` → delete all store data
  - `app/uninstalled` → mark store inactive, revoke token

### 5.2 AI Agent

- Model: Claude Sonnet 4.6 (streaming, tool use)
- BYOK: each store's `claudeApiKey` decrypted per request, `new Anthropic({ apiKey })`
- 7 tools:
  1. `get_order` — Shopify Admin GraphQL
  2. `get_tracking` — EasyPost Tracker.retrieve
  3. `cancel_order` — Shopify `orderCancel` mutation
  4. `create_refund` — Shopify `refundCreate` mutation
  5. `rebook_delivery` — EasyPost create Address → Parcel → Shipment → buy
  6. `search_knowledge` — pgvector cosine similarity RAG
  7. `escalate_to_human` — set `aiHandled: false`, notify agents
- Streaming: SSE via `ReadableStream`, tokens streamed to widget in real-time
- Multi-tenant: `storeId` checked on every DB query; API keys scoped to store
- Conversation history: last 20 messages loaded per conversation

### 5.3 Storefront Chat Widget

- Deployed as Shopify Theme App Extension (App Block, not ScriptTag)
- Merchant enables via Shopify Admin → Online Store → Themes → Customize → App Embeds
- Auto-loads on all pages when enabled
- TypeScript source bundled to `chat-widget.js` via esbuild
- Features:
  - Animated open/close (CSS transitions)
  - Real-time token streaming display
  - Tool call cards (show what AI did: "Tracked your order", "Cancelled order")
  - Mobile responsive (bottom-sheet layout on < 640px)
  - Anonymous session ID stored in localStorage
  - Customer identity linking: when Shopify customer is logged in, links anon session to `customerId`

### 5.4 Admin Inbox

- Route: `/app/inbox` and `/app/inbox/:id`
- Filter tabs: All / Open / Pending / Resolved / Escalated
- Bulk actions: Mark resolved, Assign to me
- Thread view: full conversation + customer sidebar + reply composer
- Macro picker: insert saved response templates
- Agent assignment: assign to any team member
- Real-time updates: poll every 30s (upgrade to WebSocket in v2)

### 5.5 Settings

- AI tab: Claude API key (masked after save), EasyPost key, persona name, escalation threshold slider, custom system prompt
- Widget tab: color picker (hex), position (bottom-right / bottom-left), greeting message, collect email toggle
- Team tab: invite agents by email, set role (agent / manager)

### 5.6 Billing

- Shopify Billing API v2 (GraphQL `appSubscriptionCreate`)
- 3 plans: Starter ($29), Growth ($79), Scale ($199) — all `Every30Days`
- 14-day free trial on first subscription
- Usage enforcement: check monthly conversation count against plan limit before each chat
- Plan comparison page with feature matrix

### 5.7 Knowledge Base / RAG

- Sync pipeline: `products/update` webhook → strip HTML → chunk → embed (OpenAI `text-embedding-3-small`) → upsert `KnowledgeChunk`
- Search: cosine similarity via pgvector IVFFlat index
- Manual FAQ entries via Settings → Knowledge Base (v1: JSON editor)

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | SSE first token latency < 2s (p95) |
| **Availability** | 99.9% uptime SLA (Scale plan) |
| **Security** | API keys encrypted at rest (AES-256-GCM); HMAC verification on all webhooks; CORS locked to merchant's `myshopify.com` domain |
| **Scalability** | Horizontal scale via Fly.io; Redis for distributed rate limiting |
| **Privacy** | GDPR compliant; customer PII deleted on request; no training on merchant data |
| **Compliance** | Shopify App Store requirements: no ScriptTag, CSP headers, HTTPS, GDPR webhooks, Billing API GraphQL |

---

## 7. Data Model (Summary)

See `apps/shopify-app/prisma/schema.prisma` for full schema.

Key models:
- **Store** — one per Shopify shop, holds OAuth token
- **AIConfig** — BYOK keys (encrypted), widget settings, persona config
- **Subscription** — Shopify Billing charge ID, plan, status
- **Conversation** — multi-tenant by `storeId`, tracks AI vs human handling
- **Message** — chat messages, role: customer/assistant/agent
- **ToolCall** — audit log of every AI action (input, output, status)
- **KnowledgeChunk** — product/FAQ/policy chunks with pgvector embedding

---

## 8. Subscription Plans

| Feature | Starter $29 | Growth $79 | Scale $199 |
|---------|------------|------------|------------|
| AI conversations/mo | 500 | 2,000 | Unlimited |
| Agent seats | 2 | 10 | Unlimited |
| Chat widget | ✓ | ✓ | ✓ |
| Order tracking (AI) | ✓ | ✓ | ✓ |
| Cancel / refund actions | — | ✓ | ✓ |
| EasyPost rebook | — | ✓ | ✓ |
| Macros & templates | — | ✓ | ✓ |
| Knowledge base | — | ✓ | ✓ |
| Analytics | — | ✓ | ✓ |
| SLA guarantee | — | — | ✓ |
| Custom AI persona | — | — | ✓ |
| Priority support | — | — | ✓ |
| 14-day free trial | ✓ | ✓ | ✓ |

---

## 9. Integration Points

| Integration | Purpose | Auth |
|-------------|---------|------|
| Shopify Admin API (GraphQL) | Order data, mutations (cancel, refund) | OAuth per store |
| Anthropic Claude API | AI agent (streaming, tool use) | BYOK per store |
| EasyPost API | Tracking status, rebook delivery | BYOK per store |
| OpenAI Embeddings API | Product catalog embeddings (RAG) | Platform key |
| Shopify Billing API | Subscription management | OAuth per store |

---

## 10. Marketing Website

**URL:** `apps/marketing-site` (Next.js 15 App Router, deployed to Vercel)

Sections:
1. Hero — animated headline, product mockup, "Install Free" CTA
2. Social proof bar
3. How it works — 3-step infographic
4. Features grid — 6 features with icon animations
5. Pricing — 3 plan cards with monthly billing
6. Testimonials
7. Install in 5 minutes — step-by-step guide
8. FAQ — accordion
9. Footer

SEO / Social:
- OG meta tags on every page (title, description, image)
- Twitter Card support
- Structured data: Product schema
- `/og` dynamic OG image generation (Vercel OG)

---

## 11. Acceptance Criteria

| Area | Criteria |
|------|----------|
| Install | Merchant installs app → widget appears on storefront in < 5 min |
| AI Chat | Customer asks about order → AI responds with accurate tracking in < 3s |
| BYOK | Merchant enters Claude API key → saved encrypted, used on next chat |
| Cancel | Customer says "cancel my order" → AI calls `cancel_order` tool → order cancelled, confirmation shown |
| Refund | Customer requests refund → AI calls `create_refund` → Shopify refund created |
| Rebook | Customer gives new address → AI calls `rebook_delivery` → new EasyPost shipment created |
| Escalation | AI confidence < threshold → `escalate_to_human` called → ticket appears in inbox |
| Inbox | Agent sees escalated ticket → replies → customer sees reply in widget |
| Multi-tenant | Store A cannot access Store B's conversations (verified with direct DB query) |
| Billing | Create subscription → status `active` in DB → plan limits enforced |
| GDPR | `customers/redact` webhook → customer PII removed from DB |
| Marketing | Lighthouse score > 90 · OG preview renders · CTA links work |

---

## 12. Go-Live Checklist

### App Store Submission
- [ ] All 4 GDPR webhooks tested with `shopify webhook trigger`
- [ ] App passes Shopify security scan (CSP headers present)
- [ ] Billing API uses GraphQL mutations (not REST — deprecated April 2025)
- [ ] Theme App Extension used (not ScriptTag)
- [ ] App listing complete: screenshots (6), description, privacy policy URL, support email
- [ ] Tested on Shopify Basic / Shopify / Advanced plan stores
- [ ] Tested on Dawn (OS2.0) theme + vintage theme

### Infrastructure
- [ ] PostgreSQL with pgvector enabled (Supabase or Railway)
- [ ] `ENCRYPTION_KEY` generated and set as Fly.io secret
- [ ] Redis provisioned on Upstash
- [ ] Fly.io deployment health check passing (`GET /health` → 200)
- [ ] SSL/TLS on all endpoints

### Security Checklist
- [ ] `claudeApiKey` and `easyPostApiKey` encrypted at rest (AES-256-GCM)
- [ ] Webhook HMAC verification enabled on all routes
- [ ] Rate limiting live and tested
- [ ] CORS: widget origins restricted to `*.myshopify.com`
- [ ] No secrets in version control (`.env` in `.gitignore`)

### Monitoring
- [ ] Sentry DSN configured, error events appearing in Sentry dashboard
- [ ] Uptime monitor on `/health` endpoint (Better Uptime / Checkly)
- [ ] Structured logs flowing (Pino, searchable in Fly.io log dashboard)

### Marketing Site
- [ ] Deployed to Vercel with custom domain
- [ ] OG images rendering correctly (test at opengraph.xyz)
- [ ] All CTA links point to correct Shopify App Store listing URL
- [ ] Google Analytics / Plausible tracking active

---

## 13. Out of Scope (v1)

- WhatsApp / SMS channels (v2 roadmap)
- AI training on store-specific data (fine-tuning) — RAG covers this in v1
- Multi-language AI responses — English only in v1
- Native mobile app — PWA chat widget only
- Advanced SLA/escalation routing rules
- Shopify POS integration

---

## 14. Figma Design File

Live URL: **https://www.figma.com/design/bXmDcXVjxQsz8FSUSkcUxt**
(Anyone with link can view)

Contains:
- 🎨 Design System & Components (colors, typography, spacing, all UI components)
- 🖥️ Admin App Screens (dashboard, inbox, thread, settings, billing, onboarding)
- 📱 Widget & Marketing Site (all widget states, landing page sections)
