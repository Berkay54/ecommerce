import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 150)
    return NextResponse.json({ products: [], categories: [] });
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 5,
    });
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        products: { some: { active: true } },
      },
      select: { id: true, name: true, slug: true },
      take: 3,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      {
        products: products.map(({ images, price, ...product }) => ({
          ...product,
          price: price.toString(),
          image: images[0]?.url ?? null,
        })),
        categories,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=15, stale-while-revalidate=15",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Öneriler yüklenemedi. Arama düğmesiyle devam edebilirsiniz." },
      { status: 503 },
    );
  }
}
