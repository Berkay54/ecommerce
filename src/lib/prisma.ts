import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? "public";
  // Each serverless instance keeps a single connection so concurrent Vercel
  // functions don't exhaust the Supabase pooler; local dev keeps a small pool.
  const serverless = !!process.env.VERCEL;
  return new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString,
        connectionTimeoutMillis: 5000,
        max: serverless ? 1 : 5,
        idleTimeoutMillis: serverless ? 5000 : 10000,
      },
      { schema },
    ),
  });
}
// Share one bounded pool across route bundles in the same Node process.
function client() {
  return (globalForPrisma.prisma ??= createClient());
}
// Created on first use, so `next build` can load route modules without
// DATABASE_URL; queries still fail clearly if it is missing at runtime.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = client();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
