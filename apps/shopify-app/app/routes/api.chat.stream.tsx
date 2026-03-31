/**
 * GET /api/chat/stream
 * SSE endpoint — streams AI response tokens back to the chat widget.
 * Uses Claude streaming API with tool use.
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getStoreByDomain } from "~/lib/db/queries.server";
import { getConversation } from "~/lib/db/queries.server";
import { runAgent } from "~/lib/ai/agent.server";
import { unauthenticated } from "~/shopify.server";
import { logger } from "~/lib/logger.server";
import { checkRateLimit, incrementUsage } from "~/lib/redis/client.server";
import type { SSEEvent } from "@delivai/shared-types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversation_id");
  const sessionId = url.searchParams.get("session_id");
  const shop = url.searchParams.get("shop");
  const message = url.searchParams.get("message");

  if (!conversationId || !sessionId || !shop || !message) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const store = await getStoreByDomain(shop);
  if (!store?.aiConfig?.claudeApiKey) {
    return new Response("Store not configured", { status: 503 });
  }

  const conversation = await getConversation(conversationId, store.id);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  // Verify session belongs to this conversation
  if (conversation.anonymousSessionId && conversation.anonymousSessionId !== sessionId) {
    return new Response("Unauthorized", { status: 403 });
  }

  const log = logger.child({ conversationId, shop });
  log.info("SSE stream initiated");

  // Rate limit check (skip if Redis not configured — degrades gracefully)
  if (process.env.REDIS_URL) {
    const plan = store.subscription?.plan ?? "starter";
    const rl = await checkRateLimit(store.id, plan);
    if (!rl.success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(rl.reset),
          },
        }
      );
    }
    await incrementUsage(store.id);
  }

  // Get Shopify admin client for this store (unauthenticated context using stored token)
  const { admin } = await unauthenticated.admin(shop);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: SSEEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      sendEvent({ type: "token", data: { text: "" } }); // connection established

      try {
        await runAgent({
          conversationId,
          storeId: store.id,
          encryptedClaudeApiKey: store.aiConfig!.claudeApiKey,
          storeCtx: {
            shopDomain: shop,
            aiPersonaName: store.aiConfig!.aiPersonaName,
            systemPromptOverride: store.aiConfig!.systemPromptOverride,
          },
          toolCtx: {
            adminClient: admin,
            easyPostApiKey: store.aiConfig!.easyPostApiKey,
          },
          userMessage: message,
          onEvent: sendEvent,
        });
      } catch (err) {
        log.error({ err }, "Agent stream error");
        sendEvent({ type: "error", data: { message: "Something went wrong. Please try again." } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
      "Access-Control-Allow-Origin": request.headers.get("Origin") ?? "*",
    },
  });
}
