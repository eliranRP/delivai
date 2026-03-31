/**
 * Sentry error tracking — server-side
 * Install: pnpm add @sentry/remix
 *
 * Add to entry.server.tsx:
 *   import { initSentry } from "~/lib/monitoring/sentry.server";
 *   initSentry();
 */
import * as Sentry from "@sentry/remix";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0.1,   // 10% of requests traced
    beforeSend(event) {
      // Strip sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-shopify-access-token"];
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Capture an exception with store context attached.
 */
export function captureException(
  err: unknown,
  ctx?: { storeId?: string; conversationId?: string; shop?: string }
): void {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (ctx?.storeId) scope.setTag("store_id", ctx.storeId);
    if (ctx?.shop) scope.setTag("shop", ctx.shop);
    if (ctx?.conversationId) scope.setExtra("conversation_id", ctx.conversationId);
    Sentry.captureException(err);
  });
}

/**
 * Wrap a Remix loader/action with Sentry tracing.
 * Usage: export const loader = withSentry(async ({ request }) => { ... });
 */
export const withSentry = Sentry.wrapRemixHandleError;
