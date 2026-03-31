import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

// Redirect root to /app, preserving Shopify query params (shop, host, id_token, etc.)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  return redirect(`/app${url.search}`);
}
