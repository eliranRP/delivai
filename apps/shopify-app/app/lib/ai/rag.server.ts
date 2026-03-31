import { prisma } from "~/lib/db/prisma.server";
import { logger } from "~/lib/logger.server";
import type { SearchKnowledgeOutput } from "@delivai/shared-types";

const EMBEDDING_MODEL = "text-embedding-3-small";
const TOP_K = 5;
const MIN_SIMILARITY = 0.3;

/**
 * Generate an embedding for the given text using OpenAI's embeddings API.
 * We use openai here for embeddings (separate from Anthropic for chat)
 * since Claude doesn't expose an embeddings endpoint.
 */
export async function generateEmbedding(text: string, openAiKey?: string): Promise<number[]> {
  const apiKey = openAiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: return zero vector (embedding not configured)
    logger.warn("No OpenAI key for embeddings — returning zero vector");
    return new Array(1536).fill(0);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!response.ok) throw new Error(`Embedding API error: ${response.statusText}`);
  const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0]?.embedding ?? new Array(1536).fill(0);
}

/**
 * Upsert a knowledge chunk with its embedding using pgvector.
 */
export async function upsertKnowledgeEmbedding(
  chunkId: string,
  text: string,
  openAiKey?: string,
): Promise<void> {
  const embedding = await generateEmbedding(text, openAiKey);
  const vectorLiteral = `[${embedding.join(",")}]`;

  // Raw SQL because Prisma doesn't support vector type natively
  await prisma.$executeRaw`
    UPDATE "KnowledgeChunk"
    SET embedding = ${vectorLiteral}::vector
    WHERE id = ${chunkId}
  `;
}

/**
 * Search the store's knowledge base using pgvector cosine similarity.
 * Returns top-K results filtered by storeId (multi-tenant isolation).
 */
export async function searchKnowledge(
  storeId: string,
  query: string,
  openAiKey?: string,
): Promise<SearchKnowledgeOutput["results"]> {
  const log = logger.child({ storeId, query: query.slice(0, 50) });

  try {
    const embedding = await generateEmbedding(query, openAiKey);
    const vectorLiteral = `[${embedding.join(",")}]`;

    // pgvector cosine distance: <=> operator (lower = more similar)
    const rows = await prisma.$queryRaw<
      Array<{ id: string; type: string; content: string; similarity: number }>
    >`
      SELECT id, type, content,
             1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "KnowledgeChunk"
      WHERE "storeId" = ${storeId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${vectorLiteral}::vector) > ${MIN_SIMILARITY}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${TOP_K}
    `;

    log.info({ resultCount: rows.length }, "Knowledge search complete");

    return rows.map((r) => ({
      type: r.type as "product" | "faq" | "policy",
      content: r.content,
      score: r.similarity,
    }));
  } catch (err) {
    log.error({ err }, "Knowledge search failed — returning empty");
    return [];
  }
}

/**
 * Build a context string from knowledge search results for injection into the system prompt.
 */
export function buildKnowledgeContext(results: SearchKnowledgeOutput["results"]): string {
  if (results.length === 0) return "";
  return (
    "\n\n## Relevant Store Knowledge\n" +
    results.map((r) => `[${r.type.toUpperCase()}] ${r.content}`).join("\n\n")
  );
}
