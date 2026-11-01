import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const currentUser = cache(async () => {
  // Auth.js may generate a CSRF token before its cookie read completes.
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
});
export async function requireUser(returnTo = "/hesabim") {
  const user = await currentUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(returnTo)}`);
  return user;
}
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") notFound();
  return user;
}
export function safeReturnTo(value: unknown) {
  if (
    typeof value === "string" &&
    /^\/odeme\/sonuc\/[a-zA-Z0-9_-]{1,100}$/.test(value)
  )
    return value;
  return typeof value === "string" &&
    [
      "/checkout",
      "/hesabim",
      "/hesabim/adresler",
      "/hesabim/siparisler",
      "/admin",
    ].includes(value)
    ? value
    : "/hesabim";
}
