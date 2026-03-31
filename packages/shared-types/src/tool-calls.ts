// Tool input/output types shared between AI agent and widget

export interface GetOrderInput {
  order_name?: string;
  customer_email?: string;
}

export interface GetOrderOutput {
  id: string;
  name: string;
  status: string;
  fulfillmentStatus: string;
  financialStatus: string;
  total: string;
  currency: string;
  createdAt: string;
  lineItems: Array<{ title: string; quantity: number; price: string }>;
  shippingAddress: ShippingAddress | null;
  trackerId: string | null;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

export interface GetTrackingInput {
  tracker_id: string;
}

export interface GetTrackingOutput {
  status: string;
  statusDetail: string;
  carrier: string;
  trackingCode: string;
  estimatedDeliveryDate: string | null;
  events: Array<{
    message: string;
    location: string;
    datetime: string;
  }>;
}

export interface CancelOrderInput {
  order_id: string;
  reason: "customer_request" | "duplicate" | "other";
}

export interface CancelOrderOutput {
  success: boolean;
  message: string;
  refundStatus: string | null;
}

export interface CreateRefundInput {
  order_id: string;
  amount?: number;
  reason: string;
}

export interface CreateRefundOutput {
  success: boolean;
  refundId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RebookDeliveryInput {
  order_id: string;
  new_address: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface RebookDeliveryOutput {
  success: boolean;
  newTrackerId: string | null;
  message: string;
}

export interface SearchKnowledgeInput {
  query: string;
}

export interface SearchKnowledgeOutput {
  results: Array<{
    type: "product" | "faq" | "policy";
    content: string;
    score: number;
  }>;
}

export interface EscalateToHumanInput {
  reason: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface EscalateToHumanOutput {
  success: boolean;
  message: string;
}

export type ToolName =
  | "get_order"
  | "get_tracking"
  | "cancel_order"
  | "create_refund"
  | "rebook_delivery"
  | "search_knowledge"
  | "escalate_to_human";
