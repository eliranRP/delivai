import { PrismaClient } from "@prisma/client";

declare global {
  // prevent multiple instances in development hot-reloading
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ log: ["error"] });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ log: ["query", "error", "warn"] });
  }
  prisma = global.__prisma;
}

export { prisma };
