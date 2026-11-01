import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import Loading from "@/app/loading";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import {
  CampaignSlider,
  type CampaignSlide,
} from "@/components/campaign-slider";
import { defaultCampaigns } from "@/lib/home-campaigns";
import { ProductGrid } from "@/components/catalog";
import { Icon, type IconName } from "@/components/icons";
export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}
async function HomeContent() {
  await connection();
  const featured = await prisma.product
    .findMany({
      where: { active: true, featured: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    })
    .catch((error: unknown) => {
      console.error("Ana sayfa: öne çıkan ürünler yüklenemedi.", error);
      return [];
    });
  const newest = await prisma.product
    .findMany({
      where: { active: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    })
    .catch((error: unknown) => {
      console.error("Ana sayfa: yeni gelen ürünler yüklenemedi.", error);
      return [];
    });
  const categories = await prisma.category
    .findMany({
      orderBy: { name: "asc" },
      include: {
        products: {
          where: { active: true },
          take: 1,
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    })
    .catch((error: unknown) => {
      console.error("Ana sayfa: kategoriler yüklenemedi.", error);
      return [];
    });
  const campaignProducts = [
    ...new Map(
      [...featured, ...newest].map((product) => [product.id, product]),
    ).values(),
  ];
  const maxDiscount = Math.max(
    0,
    ...campaignProducts
      .filter((product) =>
        product.variants.some((variant) => variant.stock > 0),
      )
      .map((product) => {
        const original = Number(product.comparePrice);
        return original > Number(product.price)
          ? Math.round((1 - Number(product.price) / original) * 100)
          : 0;
      }),
  );
  const managed = await prisma.campaign
    .findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })
    .catch(() => null);
  const slides: CampaignSlide[] = managed?.length
    ? managed
        .filter((slide) => slide.active)
        .slice(0, 6)
        .map((slide) => ({
          ...slide,
          theme:
            slide.theme === "sand" || slide.theme === "wine"
              ? slide.theme
              : "forest",
          ...(slide.showDiscount && maxDiscount > 0
            ? { offer: "%" + maxDiscount + "'ye" }
            : {}),
        }))
    : defaultCampaigns(maxDiscount);
  const benefits: { icon: IconName; title: string; copy: string }[] = [
    {
      icon: "truck",
      title: "Ücretsiz Kargo",
      copy: "750 TL ve üzeri siparişlerde",
    },
    { icon: "shield", title: "Güvenli Ödeme", copy: "Ödeme altyapısı yakında" },
    { icon: "return", title: "Kolay İade", copy: "14 gün içinde kolay iade" },
    {
      icon: "support",
      title: "Müşteri Desteği",
      copy: "Sorularınız için yardım merkezimiz",
    },
  ];
  return (
    <main className="wrap home-page">
      <CampaignSlider slides={slides} />
      <div className="home-manifesto">
        <span>GİY. HİSSET. KENDİN OL.</span>
        <p>İyi stil, küçük seçimlerle başlar.</p>
        <Link href="/products">
          Özen ile keşfet <Icon name="arrow" width={18} />
        </Link>
      </div>
      <section className="home-section" id="categories">
        <div className="section-heading">
          <div>
            <span className="editorial-kicker">
              01 / Kendine bir yerden başla
            </span>
            <h2>Kategorileri Keşfet</h2>
          </div>
          <Link href="/kategoriler" className="text-link">
            Tüm Kategoriler
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        {categories.length ? (
          <div className="category-grid">
            {categories.map((category) => {
              const image = category.products[0]?.images[0];
              return (
                <Link
                  className="category-card"
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  key={category.id}
                >
                  <div>
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt || category.name}
                        fill
                        unoptimized
                        sizes="180px"
                      />
                    ) : (
                      <Icon name="bag" width={36} height={36} />
                    )}
                  </div>
                  <h3>{category.name}</h3>
                  <span>
                    Keşfet
                    <Icon name="arrow" width={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty compact-empty">
            <h3>Kategoriler hazırlanıyor</h3>
            <p>Koleksiyonumuza eklenen kategorileri burada bulabilirsiniz.</p>
          </div>
        )}
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="editorial-kicker">02 / Özen seçkisi</span>
            <h2>Öne Çıkan Ürünler</h2>
            <p>Seçiminizi kolaylaştıran, özenle seçilmiş parçalar.</p>
          </div>
          <Link href="/products?featured=1" className="text-link">
            Tümünü Gör
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
      <section className="campaign-banner editorial-banner">
        <div className="editorial-banner-image">
          <Image
            src="/campaigns/street.webp"
            alt="Şehirde stil ilhamı"
            fill
            sizes="(max-width: 650px) 100vw, 40vw"
          />
        </div>
        <div>
          <span className="season-label">Stil, detaylarda saklı</span>
          <h2>Her günün favorileri.</h2>
          <p>Her gün yeniden giymek isteyeceğin parçalarla tanış.</p>
        </div>
        <Link className="button" href="/products?featured=1">
          Koleksiyonu Keşfet
          <Icon name="arrow" width={18} />
        </Link>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="editorial-kicker">03 / Keşfetmeye devam</span>
            <h2>Yeni Gelenler</h2>
            <p>Koleksiyona en son katılanlarla tanışın.</p>
          </div>
          <Link href="/products?sort=newest" className="text-link">
            Tümünü Gör
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        <ProductGrid products={newest} />
      </section>
      <section className="benefits" aria-label="Alışveriş avantajları">
        {benefits.map((benefit) => (
          <div key={benefit.title}>
            <Icon name={benefit.icon} width={28} height={28} />
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
