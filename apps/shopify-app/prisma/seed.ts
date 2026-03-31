/**
 * Prisma seed — local development data
 * Run: pnpm --filter shopify-app db:seed
 *
 * Creates:
 *  - 1 test store with full AI config
 *  - 3 conversations (open / escalated / resolved)
 *  - Realistic messages + tool calls per conversation
 *  - 2 agents, 3 macros, 2 tags
 *  - 5 knowledge chunks (products + FAQ)
 */
import { PrismaClient } from "@prisma/client";
import { encrypt } from "../app/lib/crypto/encryption.server";

const prisma = new PrismaClient();

// Fake Claude key — safe for local dev (encryption.server will encrypt it)
const FAKE_CLAUDE_KEY = "sk-ant-local-dev-key-not-real-0000000000000000000";
const FAKE_EASYPOST_KEY = "EZTKlocal_dev_key_not_real_0000000000000000000";

async function main() {
  console.log("🌱 Seeding DelivAI local database...");

  // ── Store ──────────────────────────────────────────────────────────────────
  const store = await prisma.store.upsert({
    where: { shopDomain: "test-store.myshopify.com" },
    update: {},
    create: {
      shopDomain: "test-store.myshopify.com",
      accessToken: "shpat_local_dev_token_not_real",
    },
  });
  console.log(`  ✓ Store: ${store.shopDomain}`);

  // ── AIConfig ───────────────────────────────────────────────────────────────
  await prisma.aIConfig.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      claudeApiKey: encrypt(FAKE_CLAUDE_KEY),
      easyPostApiKey: encrypt(FAKE_EASYPOST_KEY),
      aiPersonaName: "Aria",
      greetingMessage: "Hi! I can help you track or manage your order. What's your order number?",
      widgetColor: "#5B4FE8",
      widgetPosition: "bottom-right",
      autoEscalateThreshold: 0.4,
      collectEmailUpfront: false,
    },
  });
  console.log("  ✓ AIConfig with encrypted keys");

  // ── Subscription ───────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      plan: "growth",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("  ✓ Subscription: Growth plan (active)");

  // ── Agents ─────────────────────────────────────────────────────────────────
  const agent1 = await prisma.agent.create({
    data: {
      storeId: store.id,
      name: "Alex Kim",
      email: "alex@test-store.com",
      role: "manager",
      isAvailable: true,
    },
  });
  const agent2 = await prisma.agent.create({
    data: {
      storeId: store.id,
      name: "Jordan Lee",
      email: "jordan@test-store.com",
      role: "agent",
      isAvailable: true,
    },
  });
  console.log("  ✓ 2 agents created");

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagDelivery = await prisma.tag.create({
    data: { storeId: store.id, name: "delivery-issue", color: "#F59E0B" },
  });
  const tagRefund = await prisma.tag.create({
    data: { storeId: store.id, name: "refund", color: "#EF4444" },
  });
  console.log("  ✓ 2 tags created");

  // ── Macros ─────────────────────────────────────────────────────────────────
  await prisma.macro.createMany({
    data: [
      {
        storeId: store.id,
        name: "Order Shipped",
        body: "Hi {{customer_name}}, your order #{{order_number}} has shipped! Track it at {{tracking_url}}.",
        category: "shipping",
      },
      {
        storeId: store.id,
        name: "Refund Initiated",
        body: "We've initiated a refund of {{amount}} to your original payment method. Allow 5–7 business days.",
        category: "refunds",
      },
      {
        storeId: store.id,
        name: "Escalation Handoff",
        body: "I'm connecting you with a member of our team. They'll be with you shortly.",
        category: "escalation",
      },
    ],
  });
  console.log("  ✓ 3 macros created");

  // ── Conversations ──────────────────────────────────────────────────────────

  // 1. Open conversation — AI tracking in progress
  const conv1 = await prisma.conversation.create({
    data: {
      storeId: store.id,
      customerEmail: "jane.doe@example.com",
      customerName: "Jane Doe",
      anonymousSessionId: "anon_sess_001",
      status: "open",
      priority: "medium",
      aiHandled: true,
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, role: "customer", content: "Hi, where is my order #1042?" },
      { conversationId: conv1.id, role: "assistant", content: "Let me look that up for you right now!" },
      { conversationId: conv1.id, role: "assistant", content: "Found it! Your order #1042 is out for delivery. EasyPost shows it's 3 stops away — estimated delivery today by 8 PM." },
      { conversationId: conv1.id, role: "customer", content: "Great, thank you!" },
    ],
  });
  await prisma.toolCall.create({
    data: {
      conversationId: conv1.id,
      toolName: "get_tracking",
      input: { tracker_id: "trk_test_001" },
      output: { status: "out_for_delivery", eta: "today 8PM", carrier: "USPS" },
      status: "success",
      executedAt: new Date(),
    },
  });

  // 2. Escalated conversation — frustrated customer
  const conv2 = await prisma.conversation.create({
    data: {
      storeId: store.id,
      customerEmail: "bob.smith@example.com",
      customerName: "Bob Smith",
      anonymousSessionId: "anon_sess_002",
      status: "open",
      priority: "urgent",
      aiHandled: false,
      escalatedAt: new Date(Date.now() - 15 * 60 * 1000),
      assignedAgentId: agent1.id,
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, role: "customer", content: "My order #1105 arrived damaged. This is unacceptable!" },
      { conversationId: conv2.id, role: "assistant", content: "I'm so sorry to hear that. Let me escalate this to our team right away." },
      { conversationId: conv2.id, role: "assistant", content: "I've connected you with Alex from our support team.", isInternal: false },
      { conversationId: conv2.id, role: "agent", content: "Hi Bob, Alex here. I'm reviewing your order now and will process a full replacement or refund — whichever you prefer.", isInternal: false },
    ],
  });
  await prisma.toolCall.create({
    data: {
      conversationId: conv2.id,
      toolName: "escalate_to_human",
      input: { reason: "Customer received damaged item, requesting refund or replacement", priority: "urgent" },
      output: { escalated: true, assignedAgent: "Alex Kim" },
      status: "success",
      executedAt: new Date(),
    },
  });

  // 3. Resolved conversation — successful cancellation
  const conv3 = await prisma.conversation.create({
    data: {
      storeId: store.id,
      customerEmail: "carol.white@example.com",
      customerName: "Carol White",
      anonymousSessionId: "anon_sess_003",
      status: "resolved",
      priority: "low",
      aiHandled: true,
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv3.id, role: "customer", content: "I need to cancel my order #999, I ordered the wrong size." },
      { conversationId: conv3.id, role: "assistant", content: "No problem! I can cancel order #999 for you. Just to confirm — you'd like to cancel the entire order?" },
      { conversationId: conv3.id, role: "customer", content: "Yes please." },
      { conversationId: conv3.id, role: "assistant", content: "Done! Order #999 has been cancelled. You'll receive a full refund in 5–7 business days. Is there anything else I can help you with?" },
      { conversationId: conv3.id, role: "customer", content: "That's all, thanks!" },
    ],
  });
  await prisma.toolCall.createMany({
    data: [
      {
        conversationId: conv3.id,
        toolName: "get_order",
        input: { order_name: "#999", customer_email: "carol.white@example.com" },
        output: { id: "gid://shopify/Order/999", fulfillment_status: "unfulfilled", total: "49.99" },
        status: "success",
        executedAt: new Date(),
      },
      {
        conversationId: conv3.id,
        toolName: "cancel_order",
        input: { order_id: "gid://shopify/Order/999", reason: "customer_request" },
        output: { cancelled: true, refund_amount: "49.99" },
        status: "success",
        executedAt: new Date(),
      },
    ],
  });

  // Tag conv2 and conv3
  await prisma.conversationTag.createMany({
    data: [
      { conversationId: conv2.id, tagId: tagRefund.id },
      { conversationId: conv2.id, tagId: tagDelivery.id },
      { conversationId: conv3.id, tagId: tagRefund.id },
    ],
  });
  console.log("  ✓ 3 conversations with messages and tool calls");

  // ── Knowledge Chunks ───────────────────────────────────────────────────────
  await prisma.knowledgeChunk.createMany({
    data: [
      {
        storeId: store.id,
        type: "product",
        sourceId: "prod_001",
        content: "Classic Crew Neck T-Shirt — Available in S, M, L, XL. Colors: White, Black, Navy. 100% cotton. Price: $29.99.",
        metadata: { title: "Classic Crew Neck T-Shirt", handle: "classic-tee", price: "29.99" },
      },
      {
        storeId: store.id,
        type: "product",
        sourceId: "prod_002",
        content: "Premium Hoodie — Available in S, M, L, XL, XXL. Colors: Grey, Black, Forest Green. 80% cotton 20% polyester. Price: $59.99.",
        metadata: { title: "Premium Hoodie", handle: "premium-hoodie", price: "59.99" },
      },
      {
        storeId: store.id,
        type: "faq",
        sourceId: "faq_shipping",
        content: "Shipping policy: Standard shipping 5–7 business days ($4.99). Express shipping 2–3 business days ($12.99). Free shipping on orders over $75.",
        metadata: { topic: "shipping", category: "faq" },
      },
      {
        storeId: store.id,
        type: "policy",
        sourceId: "policy_returns",
        content: "Return policy: Items can be returned within 30 days of delivery. Items must be unworn and in original packaging. Refunds processed in 5–7 business days.",
        metadata: { topic: "returns", category: "policy" },
      },
      {
        storeId: store.id,
        type: "faq",
        sourceId: "faq_cancel",
        content: "Cancellation policy: Orders can be cancelled within 1 hour of placement or before fulfillment, whichever comes first. Contact support or use the chat widget.",
        metadata: { topic: "cancellation", category: "faq" },
      },
    ],
  });
  console.log("  ✓ 5 knowledge chunks (products + FAQ + policies)");

  console.log("\n✅ Seed complete!");
  console.log("\n📊 Test store summary:");
  console.log("   Store:         test-store.myshopify.com");
  console.log("   Plan:          Growth (active)");
  console.log("   Conversations: 3 (1 open, 1 escalated, 1 resolved)");
  console.log("   Agents:        2");
  console.log("   Macros:        3");
  console.log("   Knowledge:     5 chunks");
  console.log("\n🔑 Settings → AI Configuration → enter any Claude API key to test AI features");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
