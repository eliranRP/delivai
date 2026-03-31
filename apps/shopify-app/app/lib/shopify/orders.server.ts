import type { GetOrderOutput, CancelOrderOutput, CreateRefundOutput } from "@delivai/shared-types";

interface ShopifyAdminClient {
  query: (params: { data: { query: string; variables?: Record<string, unknown> } }) => Promise<{
    body: { data: Record<string, unknown>; errors?: unknown[] };
  }>;
}

const ORDER_QUERY = /* GraphQL */ `
  query GetOrder($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          id
          name
          displayFulfillmentStatus
          displayFinancialStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          createdAt
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
                originalUnitPriceSet { shopMoney { amount } }
              }
            }
          }
          shippingAddress {
            firstName lastName address1 city provinceCode zip countryCodeV2
          }
          fulfillments(first: 1) {
            trackingInfo { company number url }
          }
        }
      }
    }
  }
`;

const ORDER_CANCEL_MUTATION = /* GraphQL */ `
  mutation OrderCancel($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!, $notify: Boolean!) {
    orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock, notifyCustomer: $notify) {
      orderCancelUserErrors { message field code }
    }
  }
`;

const REFUND_CREATE_MUTATION = /* GraphQL */ `
  mutation RefundCreate($input: RefundInput!) {
    refundCreate(input: $input) {
      refund {
        id
        totalRefundedSet { shopMoney { amount currencyCode } }
        status
      }
      userErrors { message field }
    }
  }
`;

export async function getOrderByNameOrEmail(
  adminClient: ShopifyAdminClient,
  params: { order_name?: string; customer_email?: string },
): Promise<GetOrderOutput | null> {
  const queryParts: string[] = [];
  if (params.order_name) {
    const normalized = params.order_name.replace(/^#/, "");
    queryParts.push(`name:${normalized}`);
  }
  if (params.customer_email) queryParts.push(`email:${params.customer_email}`);
  if (queryParts.length === 0) return null;

  const response = await adminClient.query({
    data: { query: ORDER_QUERY, variables: { query: queryParts.join(" AND ") } },
  });

  const orders = response.body.data?.orders as
    | { edges: Array<{ node: Record<string, unknown> }> }
    | undefined;
  if (!orders?.edges?.[0]) return null;

  const order = orders.edges[0].node;
  const money = (order.totalPriceSet as Record<string, unknown>)?.shopMoney as
    | Record<string, string>
    | undefined;
  const lineItems = (
    (order.lineItems as { edges: Array<{ node: Record<string, unknown> }> })?.edges ?? []
  ).map((e) => ({
    title: e.node.title as string,
    quantity: e.node.quantity as number,
    price: ((e.node.originalUnitPriceSet as Record<string, unknown>)?.shopMoney as Record<string, string>)?.amount ?? "0",
  }));

  const addr = order.shippingAddress as Record<string, string> | null;
  const fulfillments = (order.fulfillments as Array<{ trackingInfo: Array<Record<string, string>> }>)?.[0];
  const tracking = fulfillments?.trackingInfo?.[0];

  return {
    id: order.id as string,
    name: order.name as string,
    status: order.displayFulfillmentStatus as string,
    fulfillmentStatus: order.displayFulfillmentStatus as string,
    financialStatus: order.displayFinancialStatus as string,
    total: money?.amount ?? "0",
    currency: money?.currencyCode ?? "USD",
    createdAt: order.createdAt as string,
    lineItems,
    shippingAddress: addr
      ? {
          firstName: addr.firstName ?? "",
          lastName: addr.lastName ?? "",
          address1: addr.address1 ?? "",
          city: addr.city ?? "",
          province: addr.provinceCode ?? "",
          zip: addr.zip ?? "",
          country: addr.countryCodeV2 ?? "",
        }
      : null,
    trackerId: tracking?.number ?? null,
  };
}

export async function cancelOrder(
  adminClient: ShopifyAdminClient,
  orderId: string,
  reason: "customer_request" | "duplicate" | "other",
): Promise<CancelOrderOutput> {
  const reasonMap: Record<string, string> = {
    customer_request: "CUSTOMER",
    duplicate: "FRAUD",
    other: "OTHER",
  };

  const response = await adminClient.query({
    data: {
      query: ORDER_CANCEL_MUTATION,
      variables: {
        orderId,
        reason: reasonMap[reason] ?? "OTHER",
        refund: true,
        restock: true,
        notify: true,
      },
    },
  });

  const errors = (response.body.data?.orderCancel as Record<string, unknown>)
    ?.orderCancelUserErrors as Array<{ message: string }> | undefined;
  if (errors?.length) {
    return { success: false, message: errors[0]?.message ?? "Unknown error", refundStatus: null };
  }
  return { success: true, message: "Order cancelled and refund initiated.", refundStatus: "pending" };
}

export async function createRefund(
  adminClient: ShopifyAdminClient,
  orderId: string,
  amount: number | undefined,
  reason: string,
): Promise<CreateRefundOutput> {
  const input: Record<string, unknown> = { orderId, note: reason, notify: true };
  if (amount !== undefined) {
    input.transactions = [{ kind: "REFUND", amount: amount.toFixed(2) }];
  }

  const response = await adminClient.query({
    data: { query: REFUND_CREATE_MUTATION, variables: { input } },
  });

  const result = (response.body.data?.refundCreate as Record<string, unknown>) ?? {};
  const refund = result.refund as Record<string, unknown> | undefined;
  const userErrors = result.userErrors as Array<{ message: string }> | undefined;

  if (userErrors?.length || !refund) {
    throw new Error(userErrors?.[0]?.message ?? "Refund creation failed");
  }

  const money = (refund.totalRefundedSet as Record<string, unknown>)?.shopMoney as
    | Record<string, string>
    | undefined;
  return {
    success: true,
    refundId: refund.id as string,
    amount: parseFloat(money?.amount ?? "0"),
    currency: money?.currencyCode ?? "USD",
    status: refund.status as string,
  };
}
