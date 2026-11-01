import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { cents } from "@/lib/cart";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";
import { Icon } from "@/components/icons";
type ProductPageProps = {
  params: Promise<{ slug: string }>;
};
export default function Product(props: ProductPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <ProductContent {...props} />
    </Suspense>
  );
}
async function ProductContent({ params }: ProductPageProps) {
  await connection();
  const { slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });
  if (!p) notFound();
  return (
    <main className="wrap detail-page">
      <nav className="breadcrumb" aria-label="Sayfa yolu">
        <Link href="/">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/products">Ürünler</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="detail">
        <ProductGallery
          images={p.images.map(({ id, url, alt }) => ({ id, url, alt }))}
          name={p.name}
        />
        <div className="detail-copy">
          <p className="product-category">
            {p.category?.name ?? "Koleksiyon"}
            {p.featured ? " · Öne Çıkan" : ""}
          </p>
          <h1>{p.name}</h1>
          <AddToCart
            productId={p.id}
            basePriceCents={cents(p.price)}
            comparePriceCents={p.comparePrice ? cents(p.comparePrice) : null}
            variants={p.variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              stock: variant.stock,
              priceCents: cents(variant.price ?? p.price),
            }))}
          />
          <div className="detail-services">
            <p>
              <Icon name="truck" width={20} />
              750 TL ve üzeri ücretsiz kargo
            </p>
            <p>
              <Icon name="return" width={20} />
              14 gün içinde kolay iade
            </p>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>Ürün Açıklaması</summary>
              <p className="description">
                {p.description || "Bu ürünün açıklaması yakında eklenecek."}
              </p>
            </details>
            <details>
              <summary>Kargo ve Teslimat</summary>
              <p>
                750 TL ve üzeri siparişlerde ücretsiz kargo avantajı
                sunulacaktır. Teslimat seçenekleri, sipariş sistemi açıldığında
                paylaşılacaktır.
              </p>
            </details>
            <details>
              <summary>İade ve Değişim</summary>
              <p>
                14 gün içinde kolay iade politikası uygulanacaktır. Detaylı
                koşullar satışa başlanmadan önce yayımlanacaktır.
              </p>
              <Link href="/bilgi/iade" className="text-link">
                İade koşulları
              </Link>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
