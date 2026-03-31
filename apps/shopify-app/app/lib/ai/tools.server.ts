import type Anthropic from "@anthropic-ai/sdk";
import type {
  GetOrderOutput,
  GetTrackingOutput,
  CancelOrderOutput,
  CreateRefundOutput,
  RebookDeliveryOutput,
  SearchKnowledgeOutput,
  EscalateToHumanOutput,
} from "@delivai/shared-types";
import { getOrderByNameOrEmail, cancelOrder, createRefund } from "~/lib/shopify/orders.server";
import { getTrackerStatus, rebookDelivery } from "~/lib/easypost/client.server";
import { searchKnowledge } from "~/lib/ai/rag.server";
import { escalateConversation } from "~/lib/db/queries.server";
import { decrypt } from "~/lib/crypto/encryption.server";
import { logger } from "~/lib/logger.server";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "get_order",
    description:
      "Retrieve order details for a customer. Use when the customer asks about order status, delivery, or items. Requires order number or email.",
    input_schema: {
      type: "object" as const,
      properties: {
        order_name: {
          type: "string",
          description: "Order number like #1234 or 1234",
        },
        customer_email: {
          type: "string",
          description: "Customer email address",
        },
      },
    },
  },
  {
    name: "get_tracking",
    description:
      "Get real-time carrier tracking information via EasyPost. Use after get_order to show detailed delivery status.",
    input_schema: {
      type: "object" as const,
      required: ["tracker_id"],
      properties: {
        tracker_id: {
          type: "string",
          description: "EasyPost tracker ID or tracking number from the order",
        },
      },
    },
  },
  {
    name: "cancel_order",
    description:
      "Cancel an unfulfilled order on the customer's request. Always confirm with the customer before calling this tool.",
    input_schema: {
      type: "object" as const,
      required: ["order_id", "reason"],
      properties: {
        order_id: { type: "string", description: "Shopify order GID" },
        reason: {
          type: "string",
          enum: ["customer_request", "duplicate", "other"],
        },
      },
    },
  },
  {
    name: "create_refund",
    description:
      "Initiate a refund for an order. Use for returns or partial refunds. Confirm the amount with the customer first.",
    input_schema: {
      type: "object" as const,
      required: ["order_id", "reason"],
      properties: {
        order_id: { type: "string" },
        amount: {
          type: "number",
          description: "Refund amount in store currency. Omit for full order refund.",
        },
        reason: { type: "string", description: "Reason for the refund" },
      },
    },
  },
  {
    name: "rebook_delivery",
    description:
      "Update the shipping address and create a new EasyPost shipment for a failed or returned delivery. Collect the full new address before calling.",
    input_schema: {
      type: "object" as const,
      required: ["order_id", "new_address"],
      properties: {
        order_id: { type: "string" },
        new_address: {
          type: "object",
          required: ["street1", "city", "state", "zip", "country"],
          properties: {
            street1: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the store's product catalog, FAQ, and policies. Use when the customer asks about products, shipping policies, return policies, or store hours.",
    input_schema: {
      type: "object" as const,
      required: ["query"],
      properties: {
        query: { type: "string", description: "What to search for" },
      },
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand off the conversation to a human support agent. Use when: the issue is complex, the customer is very frustrated, you cannot resolve the problem, or the customer explicitly asks for a human.",
    input_schema: {
      type: "object" as const,
      required: ["reason"],
      properties: {
        reason: { type: "string", description: "Why escalating to human" },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
        },
      },
    },
  },
];

export interface ToolExecutionContext {
  conversationId: string;
  storeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any;
  easyPostApiKey: string | null;
}

type ToolOutput =
  | GetOrderOutput
  | GetTrackingOutput
  | CancelOrderOutput
  | CreateRefundOutput
  | RebookDeliveryOutput
  | SearchKnowledgeOutput
  | EscalateToHumanOutput
  | { error: string };

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Promise<ToolOutput> {
  const log = logger.child({ toolName, conversationId: ctx.conversationId });
  log.info({ input }, "Executing tool");

  try {
    switch (toolName) {
      case "get_order": {
        const result = await getOrderByNameOrEmail(ctx.adminClient, {
          order_name: input.order_name as string | undefined,
          customer_email: input.customer_email as string | undefined,
        });
        if (!result) return { error: "Order not found. Please check the order number or email." };
        return result;
      }

      case "get_tracking": {
        if (!ctx.easyPostApiKey) {
          return {
            error:
              "Tracking integration not configured. Please ask the merchant to add their EasyPost API key.",
          };
        }
        const decryptedKey = decrypt(ctx.easyPostApiKey);
        return await getTrackerStatus(decryptedKey, input.tracker_id as string);
      }

      case "cancel_order": {
        return await cancelOrder(
          ctx.adminClient,
          input.order_id as string,
          input.reason as "customer_request" | "duplicate" | "other",
        );
      }

      case "create_refund": {
        return await createRefund(
          ctx.adminClient,
          input.order_id as string,
          input.amount as number | undefined,
          input.reason as string,
        );
      }

      case "rebook_delivery": {
        if (!ctx.easyPostApiKey) {
          return { error: "EasyPost not configured. Cannot rebook delivery." };
        }
        const decryptedKey = decrypt(ctx.easyPostApiKey);
        return await rebookDelivery(
          decryptedKey,
          input.order_id as string,
          input.new_address as {
            street1: string;
            city: string;
            state: string;
            zip: string;
            country: string;
          },
        );
      }

      case "search_knowledge": {
        const results = await searchKnowledge(ctx.storeId, input.query as string);
        return { results };
      }

      case "escalate_to_human": {
        await escalateConversation(
          ctx.conversationId,
          ctx.storeId,
          (input.priority as "low" | "medium" | "high" | "urgent") ?? "medium",
        );
        return {
          success: true,
          message:
            "I've connected you with a human agent who will be with you shortly. Thank you for your patience.",
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    log.error({ err }, "Tool execution failed");
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
