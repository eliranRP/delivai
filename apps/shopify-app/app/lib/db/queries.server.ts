import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";
import type { ConversationStatus, ConversationPriority } from "@delivai/shared-types";

// ─── Store ────────────────────────────────────────────────────────────────────

export async function getStoreByDomain(shopDomain: string) {
  return prisma.store.findUnique({
    where: { shopDomain },
    include: { aiConfig: true, subscription: true },
  });
}

export async function getStoreById(id: string) {
  return prisma.store.findUnique({
    where: { id },
    include: { aiConfig: true, subscription: true },
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function listConversations(
  storeId: string,
  options: {
    status?: ConversationStatus | "all";
    page?: number;
    pageSize?: number;
  } = {},
) {
  const { status = "all", page = 1, pageSize = 25 } = options;
  const where = {
    storeId,
    ...(status !== "all" ? { status } : {}),
  };
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        tags: { include: { tag: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.conversation.count({ where }),
  ]);
  return { conversations, total, page, pageSize };
}

export async function getConversation(id: string, storeId: string) {
  return prisma.conversation.findFirst({
    where: { id, storeId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      toolCalls: { orderBy: { createdAt: "asc" } },
      tags: { include: { tag: true } },
    },
  });
}

export async function createConversation(data: {
  storeId: string;
  anonymousSessionId: string;
  customerEmail?: string;
}) {
  return prisma.conversation.create({ data });
}

export async function updateConversationStatus(
  id: string,
  storeId: string,
  status: ConversationStatus,
) {
  return prisma.conversation.update({
    where: { id, storeId }, // storeId in where enforces tenant isolation
    data: {
      status,
      ...(status === "resolved" ? { resolvedAt: new Date() } : {}),
    },
  });
}

export async function escalateConversation(
  id: string,
  storeId: string,
  priority: ConversationPriority,
) {
  return prisma.conversation.update({
    where: { id, storeId }, // storeId in where enforces tenant isolation
    data: {
      aiHandled: false,
      escalatedAt: new Date(),
      status: "open",
      priority,
    },
  });
}

export async function linkCustomerToConversation(
  anonymousSessionId: string,
  storeId: string,
  data: { customerId: string; customerEmail: string; customerName: string },
) {
  return prisma.conversation.updateMany({
    where: { anonymousSessionId, storeId },
    data: { ...data, linkedAt: new Date() },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(data: {
  conversationId: string;
  role: "customer" | "assistant" | "agent";
  content: string;
  isInternal?: boolean;
}) {
  return prisma.message.create({ data });
}

export async function getRecentMessages(conversationId: string, limit = 20) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Tool Calls ───────────────────────────────────────────────────────────────

export async function createToolCall(data: {
  conversationId: string;
  toolName: string;
  input: Record<string, unknown>;
}) {
  return prisma.toolCall.create({
    data: { ...data, input: data.input as unknown as Prisma.InputJsonValue },
  });
}

export async function updateToolCall(
  id: string,
  data: { output?: Record<string, unknown>; status: string; errorMessage?: string },
) {
  return prisma.toolCall.update({
    where: { id },
    data: {
      status: data.status,
      errorMessage: data.errorMessage,
      executedAt: new Date(),
      ...(data.output !== undefined && {
        output: data.output as unknown as Prisma.InputJsonValue,
      }),
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function getSubscription(storeId: string) {
  return prisma.subscription.findUnique({ where: { storeId } });
}

export async function incrementConversationUsage(storeId: string) {
  return prisma.subscription.update({
    where: { storeId },
    data: { conversationsUsed: { increment: 1 } },
  });
}

export async function isWithinPlanLimit(storeId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { storeId } });
  if (!sub || sub.status !== "active") return false;
  const limits: Record<string, number> = { starter: 500, growth: 2000, scale: Infinity };
  const limit = limits[sub.plan] ?? 500;
  return sub.conversationsUsed < limit;
}
