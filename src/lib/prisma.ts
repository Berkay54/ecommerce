import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? "public";
  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000, max: 5 },
      { schema },
    ),
  });
}
export const prisma = globalForPrisma.prisma ?? createClient();
// Share one bounded pool across route bundles in the same Node process.
globalForPrisma.prisma = prisma;
