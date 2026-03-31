import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet as RemixOutlet, useLoaderData } from "@remix-run/react";
import type React from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Outlet = RemixOutlet as React.ComponentType<any>;
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY ?? "" });
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">Dashboard</a>
        <a href="/app/inbox">Inbox</a>
        <a href="/app/knowledge">Knowledge Base</a>
        <a href="/app/analytics">Analytics</a>
        <a href="/app/guides">Guides</a>
        <a href="/app/settings">Settings</a>
        <a href="/app/billing">Billing</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
