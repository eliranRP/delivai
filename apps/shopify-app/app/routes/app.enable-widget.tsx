/**
 * GET /app/enable-widget
 * One-time utility route: enables the DelivAI chat-widget App Embed
 * on the merchant's active theme by updating settings_data.json via
 * the Shopify Admin REST API (bypasses CLI which strips app embed blocks).
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, BlockStack, Text, Badge, Button } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";

const EXTENSION_UID = "288ab506-3769-fe13-0858-10bbb247f01cb0ff7c2a";
const BLOCK_KEY = "93088886728397747855";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    // 1. Find the published theme
    const themesRes = await admin.rest.get({ path: "themes" });
    const themes = (themesRes.body as any).themes as any[];
    const activeTheme = themes.find((t: any) => t.role === "main");

    if (!activeTheme) {
      return json({ success: false, error: "No active theme found", details: null });
    }

    const themeId = activeTheme.id;

    // 2. Read current settings_data.json
    const assetRes = await admin.rest.get({
      path: `themes/${themeId}/assets`,
      query: { "asset[key]": "config/settings_data.json" },
    });

    const assetBody = assetRes.body as any;
    const rawValue: string = assetBody.asset?.value ?? "{}";

    // Strip the /* ... */ comment header Shopify adds
    const jsonStr = rawValue.replace(/^\/\*[\s\S]*?\*\/\s*/m, "");
    const settings = JSON.parse(jsonStr);

    // 3. Check if already enabled
    const existingBlocks = settings.current?.blocks ?? {};
    if (existingBlocks[BLOCK_KEY]) {
      return json({
        success: true,
        already: true,
        themeId,
        themeName: activeTheme.name,
        details: "Block already present",
      });
    }

    // 4. Add the app embed block
    settings.current = settings.current ?? {};
    settings.current.blocks = {
      ...existingBlocks,
      [BLOCK_KEY]: {
        type: `shopify://apps/delivai/blocks/chat-widget/${EXTENSION_UID}`,
        disabled: false,
        settings: {
          widget_color: "#5B4FE8",
          widget_position: "bottom-right",
          greeting_message: "Hi! I can help you track or manage your order. How can I help?",
          persona_name: "Aria",
          collect_email: false,
        },
      },
    };

    // 5. Write back (include the original comment header)
    const commentHeader = `/*\n * ------------------------------------------------------------\n * IMPORTANT: The contents of this file are auto-generated.\n *\n * This file may be updated by the Shopify admin theme editor\n * or related systems. Please exercise caution as any changes\n * made to this file may be overwritten.\n * ------------------------------------------------------------\n */\n`;

    const updatedValue = commentHeader + JSON.stringify(settings, null, 2);

    await admin.rest.put({
      path: `themes/${themeId}/assets`,
      data: {
        asset: {
          key: "config/settings_data.json",
          value: updatedValue,
        },
      },
    });

    return json({
      success: true,
      already: false,
      themeId,
      themeName: activeTheme.name,
      details: "App embed block enabled successfully",
    });
  } catch (err: any) {
    return json({ success: false, error: err.message, details: String(err) });
  }
}

export default function EnableWidget() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Enable Chat Widget">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            App Embed Setup
          </Text>
          {"success" in data && data.success ? (
            <BlockStack gap="200">
              <Badge tone="success">
                {"already" in data && data.already ? "Already enabled" : "Enabled successfully"}
              </Badge>
              <Text as="p" variant="bodyMd">
                Theme: {"themeName" in data ? String(data.themeName) : ""}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {"details" in data ? String(data.details) : ""}
              </Text>
            </BlockStack>
          ) : (
            <BlockStack gap="200">
              <Badge tone="critical">Failed</Badge>
              <Text as="p" variant="bodyMd">
                {"error" in data ? String(data.error) : "Unknown error"}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {"details" in data ? String(data.details) : ""}
              </Text>
            </BlockStack>
          )}
          <Button url="/app">Back to Dashboard</Button>
        </BlockStack>
      </Card>
    </Page>
  );
}
