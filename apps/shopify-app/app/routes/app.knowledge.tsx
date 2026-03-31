import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  TextField,
  Select,
  Badge,
  ResourceList,
  ResourceItem,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
    select: { id: true },
  });

  if (!store) return json({ chunks: [] });

  const chunks = await prisma.knowledgeChunk.findMany({
    where: { storeId: store.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, type: true, content: true, sourceId: true, updatedAt: true },
  });

  return json({ chunks });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const store = await prisma.store.findUnique({ where: { shopDomain: session.shop } });
  if (!store) return json({ error: "Store not found" }, { status: 404 });

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await prisma.knowledgeChunk.deleteMany({ where: { id, storeId: store.id } });
    return json({ success: true });
  }

  if (intent === "add") {
    const type = formData.get("type") as string;
    const content = formData.get("content") as string;
    if (!content?.trim()) return json({ error: "Content is required" }, { status: 400 });

    await prisma.knowledgeChunk.create({
      data: {
        storeId: store.id,
        type: type ?? "faq",
        sourceId: crypto.randomUUID(),
        content: content.trim(),
        metadata: { manual: true },
      },
    });
    return json({ success: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export default function KnowledgePage() {
  const { chunks } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("faq");

  function handleAdd() {
    if (!newContent.trim()) return;
    const fd = new FormData();
    fd.append("intent", "add");
    fd.append("type", newType);
    fd.append("content", newContent);
    submit(fd, { method: "post" });
    setNewContent("");
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("id", id);
    submit(fd, { method: "post" });
  }

  const typeOptions = [
    { label: "FAQ", value: "faq" },
    { label: "Policy", value: "policy" },
    { label: "Product", value: "product" },
  ];

  function getTypeTone(type: string): "info" | "success" | "attention" {
    if (type === "policy") return "attention";
    if (type === "product") return "success";
    return "info";
  }

  return (
    <Page
      title="Knowledge Base"
      subtitle="Custom FAQs, policies, and information your AI uses to answer customer questions"
    >
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Add Knowledge Entry</Text>
            <InlineStack gap="400" blockAlign="end">
              <div style={{ width: 140 }}>
                <Select
                  label="Type"
                  options={typeOptions}
                  value={newType}
                  onChange={setNewType}
                />
              </div>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Content"
                  value={newContent}
                  onChange={setNewContent}
                  multiline={3}
                  placeholder="E.g. Our return policy allows returns within 30 days of purchase..."
                  autoComplete="off"
                />
              </div>
            </InlineStack>
            <InlineStack align="end">
              <Button variant="primary" onClick={handleAdd} disabled={!newContent.trim() || isLoading}>
                Add Entry
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section>
            <Card padding="0">
              {chunks.length === 0 ? (
                <EmptyState
                  heading="No knowledge entries yet"
                  image=""
                >
                  <Text as="p">Add FAQs, policies, and product info above to help your AI answer customer questions accurately.</Text>
                </EmptyState>
              ) : (
                <ResourceList
                  resourceName={{ singular: "entry", plural: "entries" }}
                  items={chunks}
                  renderItem={(chunk) => (
                    <ResourceItem
                      id={chunk.id}
                      onClick={() => {}}
                      shortcutActions={[
                        {
                          content: "Delete",
                          onAction: () => handleDelete(chunk.id),
                        },
                      ]}
                    >
                      <InlineStack gap="300" blockAlign="start">
                        <Badge tone={getTypeTone(chunk.type)}>{chunk.type}</Badge>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd">{chunk.content.slice(0, 120)}{chunk.content.length > 120 ? "…" : ""}</Text>
                          <Text as="p" variant="bodyXs" tone="subdued">
                            Updated {new Date(chunk.updatedAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
