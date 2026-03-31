/**
 * POST /api/identity
 * Links an anonymous chat session to an authenticated Shopify customer.
 */
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { linkCustomerToConversation, getStoreByDomain } from "~/lib/db/queries.server";
import type { LinkIdentityRequest } from "@delivai/shared-types";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = (await request.json()) as LinkIdentityRequest;
  const { anonymousSessionId, shopifyCustomerId, customerEmail, customerName } = body;

  if (!anonymousSessionId || !shopifyCustomerId) {
    return json({ error: "anonymousSessionId and shopifyCustomerId are required" }, { status: 400 });
  }

  const shop =
    request.headers.get("X-Shop-Domain") ?? new URL(request.url).searchParams.get("shop") ?? "";
  const store = await getStoreByDomain(shop);
  if (!store) return json({ error: "Store not found" }, { status: 404 });

  await linkCustomerToConversation(anonymousSessionId, store.id, {
    customerId: shopifyCustomerId,
    customerEmail: customerEmail ?? "",
    customerName: customerName ?? "",
  });

  return json(
    { success: true },
    {
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("Origin") ?? "*",
      },
    },
  );
}

export async function loader() {
  return json({ ok: true });
}
