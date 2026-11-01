import Link from "next/link";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Loading from "@/app/loading";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { cents } from "@/lib/cart";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";
import { Icon } from "@/components/icons";
import { ProductReviews } from "@/components/product-reviews";
import { siteOrigin, jsonLd } from "@/lib/site";
import { BRAND_NAME, brandTitle } from "@/lib/brand";
type ProductPageProps = {
  params: Promise<{ slug: string }>;
};
const getProduct = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  }),
);
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product)
    return { title: brandTitle("Ürün Bulunamadı"), robots: { index: false } };
  const description =
    product.description?.slice(0, 160) ||
    `${product.name} ve özenle seçilmiş ürünler ${BRAND_NAME}'de.`;
  return {
    title: brandTitle(product.name),
    description,
    ...(siteOrigin()
      ? {
          alternates: {
            canonical: `${siteOrigin()}/products/${encodeURIComponent(product.slug)}`,
          },
        }
      : {}),
    ...(product.slug.startsWith("demo-")
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      title: product.name,
      description,
      locale: "tr_TR",
      images: product.images
        .slice(0, 1)
        .map((image) => ({ url: image.url, alt: image.alt || product.name })),
    },
  };
}
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
  const p = await getProduct(slug);
  if (!p) notFound();
  return (
    <main className="wrap detail-page">
      {!p.slug.startsWith("demo-") && siteOrigin() && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.description,
              image: p.images.map((image) => image.url),
              url: `${siteOrigin()}/products/${encodeURIComponent(p.slug)}`,
              offers: p.variants.map((variant) => ({
                "@type": "Offer",
                priceCurrency: "TRY",
                price: (variant.price ?? p.price).toString(),
                sku: variant.sku,
                availability:
                  variant.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `${siteOrigin()}/products/${encodeURIComponent(p.slug)}`,
              })),
            }),
          }}
        />
      )}
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
            productName={p.name}
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
              <summary>Kumaş ve Bakım</summary>
              <p>
                Ürüne özel kumaş içeriği ve bakım bilgileri açıklamada
                paylaşılır. Temizlik ve ütüleme sırasında ürünün iç etiketindeki
                talimatları esas alın. Bilgi belirtilmemişse satın almadan önce
                destek ekibine danışın.
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
      <Suspense fallback={<p role="status">Değerlendirmeler yükleniyor…</p>}>
        <ProductReviews productId={p.id} />
      </Suspense>
    </main>
  );
}
