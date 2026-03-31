/**
 * POST /api/chat
 * Accepts a customer message, validates plan limits, and returns a message ID + stream URL.
 * The actual AI response is streamed via GET /api/chat/stream
 */
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getStoreByDomain } from "~/lib/db/queries.server";
import { isWithinPlanLimit, createConversation, incrementConversationUsage } from "~/lib/db/queries.server";
import { logger } from "~/lib/logger.server";
import type { ChatMessageRequest } from "@delivai/shared-types";

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function action({ request }: ActionFunctionArgs) {
  // CORS — allow storefront origins
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: ChatMessageRequest;
  try {
    body = (await request.json()) as ChatMessageRequest;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId, anonymousSessionId, content } = body;
  if (!conversationId || !anonymousSessionId || !content?.trim()) {
    return json({ error: "conversationId, anonymousSessionId and content are required" }, { status: 400 });
  }

  // Extract shop domain from request origin or header
  const shopDomain =
    request.headers.get("X-Shop-Domain") ?? new URL(request.url).searchParams.get("shop") ?? "";
  if (!shopDomain) {
    return json({ error: "Missing shop domain" }, { status: 400 });
  }

  // Rate limit: 60 messages per minute per session
  if (!checkRateLimit(`${shopDomain}:${anonymousSessionId}`, 60)) {
    return json({ error: "Too many requests" }, { status: 429 });
  }

  const store = await getStoreByDomain(shopDomain);
  if (!store) return json({ error: "Store not found" }, { status: 404 });
  if (!store.aiConfig?.claudeApiKey) {
    return json({ error: "AI not configured. Please set up your Claude API key in the dashboard." }, { status: 503 });
  }

  // Enforce plan conversation limits
  const withinLimit = await isWithinPlanLimit(store.id);
  if (!withinLimit) {
    return json(
      { error: "Monthly conversation limit reached. Please upgrade your plan." },
      { status: 429 },
    );
  }

  await incrementConversationUsage(store.id);

  logger.info({ conversationId, shopDomain }, "Chat message accepted");

  return json(
    {
      messageId: crypto.randomUUID(),
      streamUrl: `/api/chat/stream?conversation_id=${conversationId}&session_id=${anonymousSessionId}&shop=${shopDomain}&message=${encodeURIComponent(content)}`,
    },
    {
      headers: corsHeaders(request),
    },
  );
}

export async function loader({ request }: ActionFunctionArgs) {
  // Handle widget config request
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return json({ error: "Missing shop" }, { status: 400 });

  const store = await getStoreByDomain(shop);
  if (!store?.aiConfig) return json({ error: "Not configured" }, { status: 404 });

  const { aiConfig } = store;
  return json(
    {
      widgetColor: aiConfig.widgetColor,
      widgetPosition: aiConfig.widgetPosition,
      greetingMessage: aiConfig.greetingMessage,
      personaName: aiConfig.aiPersonaName,
      collectEmailUpfront: aiConfig.collectEmailUpfront,
    },
    { headers: corsHeaders(request) },
  );
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  // Only allow *.myshopify.com origins — prevents cross-site abuse
  const allowed = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/.test(origin)
    ? origin
    : "null";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Shop-Domain",
    "Access-Control-Max-Age": "86400",
  };
}
