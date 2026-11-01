import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function consumeAuthAttempt(
  scope: string,
  identifier: string,
  limit = 10,
) {
  const key = createHash("sha256")
    .update(`${scope}:${identifier}`)
    .digest("hex");
  const now = new Date();
  const resetAt = new Date(now.getTime() + 15 * 60 * 1000);
  // One atomic statement keeps the limit shared by all Vercel instances.
  const rows = await prisma.$queryRaw<{ attempts: number }[]>`
    INSERT INTO "AuthRateLimit" ("key", "attempts", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE WHEN "AuthRateLimit"."resetAt" <= ${now} THEN 1 ELSE "AuthRateLimit"."attempts" + 1 END,
      "resetAt" = CASE WHEN "AuthRateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "AuthRateLimit"."resetAt" END
    RETURNING "attempts"`;
  return rows[0].attempts <= limit;
}
