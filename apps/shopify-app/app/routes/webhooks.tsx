import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";
import { logger } from "~/lib/logger.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);
  const log = logger.child({ topic, shop });

  log.info("Webhook received");

  switch (topic) {
    // ─── App lifecycle ──────────────────────────────────────────────────────
    case "APP_UNINSTALLED": {
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
      }
      log.info("App uninstalled — sessions cleared");
      break;
    }

    // ─── GDPR (mandatory for App Store) ─────────────────────────────────────
    case "CUSTOMERS_DATA_REQUEST": {
      // TODO: In production, export customer data and send to merchant
      log.info({ customerId: (payload as Record<string, unknown>)?.customer }, "Data request received");
      break;
    }

    case "CUSTOMERS_REDACT": {
      const p = payload as { customer?: { id?: number; email?: string } };
      const customerGid = p.customer?.id ? `gid://shopify/Customer/${p.customer.id}` : null;
      const customerEmail = p.customer?.email ?? null;

      const store = await prisma.store.findUnique({ where: { shopDomain: shop } });
      if (store) {
        // Anonymize conversation data
        await prisma.conversation.updateMany({
          where: {
            storeId: store.id,
            ...(customerGid ? { customerId: customerGid } : {}),
            ...(customerEmail ? { customerEmail } : {}),
          },
          data: {
            customerId: null,
            customerEmail: null,
            customerName: null,
            anonymousSessionId: null,
          },
        });
        log.info("Customer data redacted");
      }
      break;
    }

    case "SHOP_REDACT": {
      // Merchant deleted shop or revoked — mark store as GDPR deleted
      await prisma.store.updateMany({
        where: { shopDomain: shop },
        data: { gdprDeletedAt: new Date() },
      });
      log.info("Shop redact complete");
      break;
    }

    // ─── Product sync (RAG embedding pipeline) ──────────────────────────────
    case "PRODUCTS_UPDATE":
    case "PRODUCTS_CREATE": {
      const product = payload as {
        id?: number;
        title?: string;
        body_html?: string;
        product_type?: string;
        tags?: string;
        variants?: Array<{ price?: string; sku?: string }>;
      };

      const store = await prisma.store.findUnique({ where: { shopDomain: shop } });
      if (store && product.id) {
        const sourceId = `gid://shopify/Product/${product.id}`;
        const content = [
          `Product: ${product.title ?? ""}`,
          product.body_html?.replace(/<[^>]*>/g, " ") ?? "",
          `Type: ${product.product_type ?? ""}`,
          `Tags: ${product.tags ?? ""}`,
          product.variants?.[0]?.price ? `Price: $${product.variants[0].price}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        await prisma.knowledgeChunk.upsert({
          where: { storeId_sourceId: { storeId: store.id, sourceId } },
          create: {
            storeId: store.id,
            type: "product",
            sourceId,
            content,
            metadata: {
              title: product.title,
              price: product.variants?.[0]?.price,
              productType: product.product_type,
            },
          },
          update: { content, updatedAt: new Date() },
        });

        // Trigger background embedding job (handled by a queue in production)
        // For now, we log — in production use Bull/BullMQ
        log.info({ sourceId }, "Product chunk upserted, embedding queued");
      }
      break;
    }

    // ─── Order events ────────────────────────────────────────────────────────
    case "ORDERS_UPDATED":
    case "ORDERS_FULFILLED": {
      log.info({ orderId: (payload as Record<string, unknown>)?.id }, "Order event received");
      break;
    }

    default:
      log.warn({ topic }, "Unhandled webhook topic");
  }

  return new Response(null, { status: 200 });
};
