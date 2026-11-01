import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
let client: PrismaClient | undefined;
export async function databaseRead<T>(
  query: (db: PrismaClient) => Promise<T>,
): Promise<T> {
  const url = new URL(process.env.DATABASE_URL!);
  const db = (client ??= new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url.href, connectionTimeoutMillis: 5000, max: 1 },
      { schema: url.searchParams.get("schema") ?? "public" },
    ),
  }));
  return query(db);
}
export async function closeTestDatabase() {
  await client?.$disconnect();
  client = undefined;
}
