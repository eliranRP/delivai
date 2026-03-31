/**
 * GET /health
 * Health check endpoint — used by Fly.io and uptime monitors.
 * Returns 200 if the app is up, 503 if DB is unreachable.
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/prisma.server";

export async function loader(_: LoaderFunctionArgs) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: "Database unreachable" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
