export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type ConversationPriority = "low" | "medium" | "high" | "urgent";
export type MessageRole = "customer" | "assistant" | "agent";
export type ToolCallStatus = "pending" | "success" | "error";

export interface Conversation {
  id: string;
  storeId: string;
  customerId: string | null;
  anonymousSessionId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  status: ConversationStatus;
  priority: ConversationPriority;
  assignedAgentId: string | null;
  aiHandled: boolean;
  escalatedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  toolCalls?: ToolCall[];
  tags?: Tag[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  conversationId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: ToolCallStatus;
  executedAt: Date | null;
  createdAt: Date;
}

export interface Tag {
  id: string;
  storeId: string;
  name: string;
  color: string;
}

export interface Agent {
  id: string;
  storeId: string;
  name: string;
  email: string;
  role: "agent" | "manager";
  isAvailable: boolean;
  avatarUrl: string | null;
}

export interface AIConfig {
  id: string;
  storeId: string;
  claudeApiKey: string; // encrypted at rest
  easyPostApiKey: string | null;
  systemPromptOverride: string | null;
  autoEscalateThreshold: number;
  greetingMessage: string;
  widgetColor: string;
  widgetPosition: "bottom-right" | "bottom-left";
  collectEmailUpfront: boolean;
  aiPersonaName: string;
}
