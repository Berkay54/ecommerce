import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { brandTitle } from "@/lib/brand";
export const metadata = { title: brandTitle("Kategoriler") };
export default function CategoriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CategoriesContent />
    </Suspense>
  );
}
async function CategoriesContent() {
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  return (
    <main className="wrap catalog-page">
      <nav className="breadcrumb" aria-label="Sayfa yolu">
        <Link href="/">Ana Sayfa</Link>
        <span>/</span>
        <span>Kategoriler</span>
      </nav>
      <h1>Kategorileri Keşfet</h1>
      {categories.length ? (
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-card"
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
            >
              <div>
                <Icon name="bag" width={36} height={36} />
              </div>
              <h2>{category.name}</h2>
              <p>{category._count.products} ürün</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Kategoriler hazırlanıyor</h2>
          <p>Koleksiyonumuza eklenen kategorileri burada bulabilirsiniz.</p>
          <Link href="/products" className="button">
            Ürünleri Keşfet
          </Link>
        </div>
      )}
    </main>
  );
}
