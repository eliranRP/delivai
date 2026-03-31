import { describe, it, expect, vi } from "vitest";
import { generateEmbedding, buildKnowledgeContext } from "~/lib/ai/rag.server";

// searchKnowledge uses raw SQL (prisma.$queryRaw) — mock separately
vi.mock("~/lib/ai/rag.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/lib/ai/rag.server")>();
  return {
    ...actual,
    searchKnowledge: vi.fn().mockResolvedValue([
      {
        id: "chunk_001",
        type: "faq",
        content: "Return policy: Items can be returned within 30 days.",
        metadata: { topic: "returns" },
        similarity: 0.92,
      },
      {
        id: "chunk_002",
        type: "product",
        content: "Premium Hoodie — $59.99, available S–XXL.",
        metadata: { title: "Premium Hoodie" },
        similarity: 0.85,
      },
    ]),
  };
});

describe("rag.server", () => {
  describe("generateEmbedding", () => {
    it("returns a 1536-dimensional vector", async () => {
      const embedding = await generateEmbedding("Where is my order?");
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(1536);
    });

    it("all values are numbers", async () => {
      const embedding = await generateEmbedding("test query");
      embedding.forEach((v) => expect(typeof v).toBe("number"));
    });
  });

  describe("buildKnowledgeContext", () => {
    it("formats results into a readable string", () => {
      const results = [
        {
          type: "faq" as const,
          content: "Return policy: 30 days.",
          score: 0.9,
        },
      ];
      const ctx = buildKnowledgeContext(results);
      expect(typeof ctx).toBe("string");
      expect(ctx).toContain("Return policy");
    });

    it("returns empty string for empty results", () => {
      expect(buildKnowledgeContext([])).toBe("");
    });
  });
});
