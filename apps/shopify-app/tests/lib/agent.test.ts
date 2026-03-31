import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAgent } from "~/lib/ai/agent.server";
import { encrypt } from "~/lib/crypto/encryption.server";
import { prisma } from "~/lib/db/prisma.server";

// Fake Shopify admin client
const mockAdminClient = {
  graphql: vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({
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
                lineItems: { edges: [] },
                shippingAddress: { address1: "123 Main St", city: "New York" },
                customer: { email: "jane@example.com", firstName: "Jane" },
              },
            },
          ],
        },
      },
    }),
  }),
};

describe("agent.server / runAgent", () => {
  const encryptedKey = encrypt("sk-ant-api03-fake-key-for-testing-0000000000");

  beforeEach(() => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "msg_001",
      conversationId: "conv_001",
      role: "assistant",
      content: "Hello world!",
      isInternal: false,
      createdAt: new Date(),
    });
    vi.mocked(prisma.conversation.update).mockResolvedValue({} as any);
    vi.mocked(prisma.toolCall.create).mockResolvedValue({} as any);
  });

  it("calls onEvent with token events during streaming", async () => {
    const events: Array<{ type: string }> = [];

    await runAgent({
      conversationId: "conv_001",
      storeId: "store_001",
      encryptedClaudeApiKey: encryptedKey,
      storeCtx: {
        shopDomain: "test-store.myshopify.com",
        aiPersonaName: "Aria",
        systemPromptOverride: null,
      },
      toolCtx: {
        adminClient: mockAdminClient as any,
        easyPostApiKey: null,
      },
      userMessage: "Hello",
      onEvent: (event) => events.push(event),
    });

    const tokenEvents = events.filter((e) => e.type === "token");
    expect(tokenEvents.length).toBeGreaterThan(0);
  });

  it("calls onEvent with message_complete at the end", async () => {
    const events: Array<{ type: string }> = [];

    await runAgent({
      conversationId: "conv_001",
      storeId: "store_001",
      encryptedClaudeApiKey: encryptedKey,
      storeCtx: {
        shopDomain: "test-store.myshopify.com",
        aiPersonaName: "Aria",
        systemPromptOverride: null,
      },
      toolCtx: {
        adminClient: mockAdminClient as any,
        easyPostApiKey: null,
      },
      userMessage: "Where is my order?",
      onEvent: (event) => events.push(event),
    });

    const completeEvent = events.find((e) => e.type === "message_complete");
    expect(completeEvent).toBeDefined();
  });

  it("loads conversation history from the database", async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      {
        id: "msg_prev_001",
        conversationId: "conv_001",
        role: "customer",
        content: "I ordered yesterday.",
        isInternal: false,
        createdAt: new Date(Date.now() - 60_000),
      },
    ]);

    const events: Array<{ type: string }> = [];
    await runAgent({
      conversationId: "conv_001",
      storeId: "store_001",
      encryptedClaudeApiKey: encryptedKey,
      storeCtx: {
        shopDomain: "test-store.myshopify.com",
        aiPersonaName: "Aria",
        systemPromptOverride: null,
      },
      toolCtx: { adminClient: mockAdminClient as any, easyPostApiKey: null },
      userMessage: "Any updates?",
      onEvent: (event) => events.push(event),
    });

    // findMany called to fetch history
    expect(vi.mocked(prisma.message.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: "conv_001" },
      })
    );
  });
});
