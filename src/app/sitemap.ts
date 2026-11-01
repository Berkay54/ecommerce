import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicIndexing, siteOrigin } from "@/lib/site";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!publicIndexing()) return [];
  await connection();
  const origin = siteOrigin()!;
  const products = await prisma.product.findMany({
    where: { active: true, NOT: { slug: { startsWith: "demo-" } } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: origin, priority: 1 },
    { url: `${origin}/products`, priority: 0.9 },
    { url: `${origin}/kategoriler`, priority: 0.7 },
    ...products.map((product) => ({
      url: `${origin}/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      priority: 0.8,
    })),
  ];
}
