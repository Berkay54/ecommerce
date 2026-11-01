import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { ProductGrid } from "@/components/catalog";
import {
  CatalogFilters,
  CatalogSort,
  type FilterValues,
} from "@/components/catalog-filters";
export const metadata = { title: "Ürünler · Form & Field" };
type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export default function Products(props: ProductsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsContent {...props} />
    </Suspense>
  );
}
async function ProductsContent({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const value = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : "";
  const price = (key: string) =>
    /^\d{1,8}(\.\d{1,2})?$/.test(value(key)) ? value(key) : "";
  const values: FilterValues = {
    category: value("category").slice(0, 180),
    min: price("min"),
    max: price("max"),
    stock: value("stock") === "1" ? "1" : "",
    q: value("q").trim().slice(0, 150),
    sort: ["newest", "price-asc", "price-desc", "popular"].includes(
      value("sort"),
    )
      ? value("sort")
      : "recommended",
    campaign: value("campaign") === "1" ? "1" : "",
    featured: value("featured") === "1" ? "1" : "",
    favorites: value("favorites").slice(0, 10100),
  };
  const page = Math.max(1, Math.min(100000, Number(value("page")) || 1)) | 0;
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(values.category ? { category: { slug: values.category } } : {}),
    ...(values.featured ? { featured: true } : {}),
    ...(values.stock ? { variants: { some: { stock: { gt: 0 } } } } : {}),
    ...(values.campaign
      ? { comparePrice: { gt: prisma.product.fields.price } }
      : {}),
    ...(values.favorites
      ? {
          id: {
            in:
              values.favorites === "empty"
                ? []
                : values.favorites
                    .split(",")
                    .filter((id) => id.length <= 100)
                    .slice(0, 100),
          },
        }
      : {}),
    ...(values.min || values.max
      ? {
          price: {
            ...(values.min ? { gte: values.min } : {}),
            ...(values.max ? { lte: values.max } : {}),
          },
        }
      : {}),
    ...(values.q
      ? {
          OR: [
            { name: { contains: values.q, mode: "insensitive" } },
            { description: { contains: values.q, mode: "insensitive" } },
            { category: { name: { contains: values.q, mode: "insensitive" } } },
            {
              variants: {
                some: { sku: { contains: values.q, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
  const orders: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
    recommended: [{ featured: "desc" }, { createdAt: "desc" }],
    newest: [{ createdAt: "desc" }],
    "price-asc": [{ price: "asc" }, { id: "asc" }],
    "price-desc": [{ price: "desc" }, { id: "asc" }],
    popular: [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }],
  };
  const [products, categories, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: orders[values.sort],
      take: 24,
      skip: (page - 1) * 24,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.count({ where }),
  ]);
  const href = (next: number) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    params.set("page", String(next));
    return `/products?${params}`;
  };
  const title = values.favorites
    ? "Favorilerim"
    : values.campaign
      ? "Kampanyalar"
      : values.featured
        ? "Öne Çıkan Ürünler"
        : "Ürünler";
  return (
    <main className="wrap catalog-page">
      <nav className="breadcrumb" aria-label="Sayfa yolu">
        <Link href="/">Ana Sayfa</Link>
        <span>/</span>
        <span>{title}</span>
      </nav>
      <div className="catalog-title">
        <div>
          <h1>{title}</h1>
          <p>
            {count.toLocaleString("tr-TR")} ürün
            {values.q ? ` · “${values.q}” için sonuçlar` : ""}
          </p>
        </div>
        <CatalogSort key={JSON.stringify(values)} values={values} />
      </div>
      <div className="catalog-layout">
        <CatalogFilters
          key={JSON.stringify(values)}
          categories={categories}
          values={values}
        />
        <section className="catalog-results" aria-label="Ürün listesi">
          {values.category && (
            <p className="active-filter">
              {categories.find((category) => category.slug === values.category)
                ?.name ?? "Seçili kategori"}
              <Link href="/products" aria-label="Kategori filtresini temizle">
                Temizle
              </Link>
            </p>
          )}
          <ProductGrid products={products} />
          <nav className="pagination" aria-label="Sayfalar">
            {page > 1 && <Link href={href(page - 1)}>Önceki</Link>}
            {count > 24 && (
              <span>
                Sayfa {page} / {Math.ceil(count / 24)}
              </span>
            )}
            {page * 24 < count && <Link href={href(page + 1)}>Sonraki</Link>}
          </nav>
        </section>
      </div>
    </main>
  );
}
