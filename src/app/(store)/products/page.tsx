import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { ProductGrid } from "@/components/catalog";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const query = await searchParams;
  const category = typeof query.category === "string" ? query.category : "";
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1)) | 0;
  const where = {
    active: true,
    ...(category ? { category: { slug: category } } : {}),
  };
  const [products, categories, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 24,
      skip: (page - 1) * 24,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count({ where }),
  ]);
  const href = (p: number) =>
    `/products?${new URLSearchParams({ ...(category ? { category } : {}), page: String(p) })}`;
  return (
    <main className="wrap collection">
      <p className="eyebrow">Objects with a point of view</p>
      <h1>
        The collection<span className="count">{count}</span>
      </h1>
      <nav className="filters" aria-label="Filter by category">
        <Link className={!category ? "selected" : ""} href="/products">
          All objects
        </Link>
        {categories.map((c) => (
          <Link
            className={category === c.slug ? "selected" : ""}
            key={c.id}
            href={`/products?category=${encodeURIComponent(c.slug)}`}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <ProductGrid products={products} />
      <nav className="pagination" aria-label="Pagination">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        {count > 24 && <span>Page {page}</span>}
        {page * 24 < count && <Link href={href(page + 1)}>Next</Link>}
      </nav>
    </main>
  );
}
