export * from "./conversation";
export * from "./tool-calls";

// Billing plans
export type BillingPlan = "starter" | "growth" | "scale";

export const PLAN_LIMITS: Record<
  BillingPlan,
  { conversationsPerMonth: number; maxAgents: number; price: number }
> = {
  starter: { conversationsPerMonth: 500, maxAgents: 2, price: 29 },
  growth: { conversationsPerMonth: 2000, maxAgents: 10, price: 79 },
  scale: { conversationsPerMonth: Infinity, maxAgents: Infinity, price: 199 },
};

// Chat widget API contracts
export interface ChatStartRequest {
  storeId: string;
  anonymousSessionId: string;
  customerEmail?: string;
}

export interface ChatStartResponse {
  conversationId: string;
  greetingMessage: string;
  widgetConfig: {
    color: string;
    position: "bottom-right" | "bottom-left";
    personaName: string;
  };
}

export interface ChatMessageRequest {
  conversationId: string;
  anonymousSessionId: string;
  content: string;
}

export interface ChatMessageResponse {
  messageId: string;
  streamUrl: string;
}

export interface LinkIdentityRequest {
  anonymousSessionId: string;
  shopifyCustomerId: string;
  customerEmail: string;
  customerName: string;
}

// SSE event types
export type SSEEventType =
  | "token"
  | "tool_start"
  | "tool_result"
  | "message_complete"
  | "error"
  | "escalated";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}
