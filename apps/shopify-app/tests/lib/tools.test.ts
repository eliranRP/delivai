import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTool } from "~/lib/ai/tools.server";
import { encrypt } from "~/lib/crypto/encryption.server";
import { prisma } from "~/lib/db/prisma.server";

// Fake Shopify admin client — orders.server.ts uses adminClient.query()
const adminWithOrder = {
  query: vi.fn().mockResolvedValue({
    body: {
      data: {
        orders: {
          edges: [
            {
              node: {
                id: "gid://shopify/Order/1042",
                name: "#1042",
                displayFulfillmentStatus: "UNFULFILLED",
                displayFinancialStatus: "PAID",
                totalPriceSet: { shopMoney: { amount: "49.99", currencyCode: "USD" } },
                createdAt: "2026-03-01T10:00:00Z",
                lineItems: {
                  edges: [
                    {
                      node: {
                        title: "Classic Tee",
                        quantity: 1,
                        originalUnitPriceSet: { shopMoney: { amount: "29.99" } },
                      },
                    },
                  ],
                },
                shippingAddress: {
                  firstName: "Jane",
                  lastName: "Doe",
                  address1: "123 Main St",
                  city: "New York",
                  provinceCode: "NY",
                  zip: "10001",
                  countryCodeV2: "US",
                },
                fulfillments: [],
              },
            },
          ],
        },
      },
    },
  }),
};

const baseCtx = {
  storeId: "store_001",
  adminClient: adminWithOrder as any,
  easyPostApiKey: encrypt("EZTKFAKEKEY"),
  conversationId: "conv_001",
};

// ctx without EasyPost key (for testing missing-key paths)
const ctxNoEasyPost = { ...baseCtx, easyPostApiKey: null };

describe("tools.server / executeTool", () => {
  beforeEach(() => {
    vi.mocked(prisma.conversation.update).mockResolvedValue({} as any);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { id: "chunk_001", type: "faq", content: "Return policy: 30 days", metadata: {}, similarity: 0.92 },
    ]);
  });

  describe("get_order", () => {
    it("returns order details for a valid order", async () => {
      const result = await executeTool(
        "get_order",
        { order_name: "#1042", customer_email: "jane@example.com" },
        baseCtx
      );
      // Should have order fields, not an error
      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("id");
    });
  });

  describe("get_tracking", () => {
    it("returns tracking status when EasyPost key is configured", async () => {
      const result = await executeTool(
        "get_tracking",
        { tracker_id: "trk_test_001" },
        baseCtx
      );
      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("status");
    });

    it("returns error object when EasyPost key is not configured", async () => {
      const result = await executeTool(
        "get_tracking",
        { tracker_id: "trk_test_001" },
        ctxNoEasyPost
      );
      expect(result).toHaveProperty("error");
    });
  });

  describe("search_knowledge", () => {
    it("returns an object with results array", async () => {
      const result = await executeTool(
        "search_knowledge",
        { query: "return policy" },
        baseCtx
      ) as { results: unknown[] };
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe("escalate_to_human", () => {
    it("calls prisma.conversation.update with storeId in where clause", async () => {
      await executeTool(
        "escalate_to_human",
        { reason: "Customer is very upset", priority: "high" },
        baseCtx
      );

      expect(vi.mocked(prisma.conversation.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "conv_001", storeId: "store_001" }),
          data: expect.objectContaining({ aiHandled: false }),
        })
      );
    });

    it("returns success: true", async () => {
      const result = await executeTool(
        "escalate_to_human",
        { reason: "Customer is very upset", priority: "high" },
        baseCtx
      );
      expect(result).toHaveProperty("success", true);
    });
  });

  describe("unknown tool", () => {
    it("returns an error object for unrecognized tool names", async () => {
      // executeTool returns {error} rather than throwing — matches the implementation
      const result = await executeTool("nonexistent_tool", {}, baseCtx);
      expect(result).toHaveProperty("error");
      expect((result as { error: string }).error).toContain("Unknown tool");
    });
  });
});
