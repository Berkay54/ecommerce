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
import { BRAND_NAME, BRAND_WORDMARK } from "@/lib/brand";
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
    <main className="home-page fashion-home">
      <CampaignSlider slides={slides} />
      <div className="home-manifesto wrap">
        <span>GİY. HİSSET. KENDİN OL.</span>
        <p>İyi stil, küçük seçimlerle başlar.</p>
        <Link href="/products">
          {BRAND_NAME} ile keşfet <Icon name="arrow" width={18} />
        </Link>
      </div>
      <section className="home-section category-index wrap" id="categories">
        <div className="section-heading">
          <div>
            <h2>Nereden başlayalım?</h2>
          </div>
          <Link href="/kategoriler" className="text-link">
            Tüm Kategoriler
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        {categories.length ? (
          <div className="category-paths">
            {categories.map((category) => {
              return (
                <Link
                  className="category-path"
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  key={category.id}
                >
                  <h3>{category.name}</h3>
                  <Icon name="arrow" width={19} />
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
      <section className="winter-editorial wrap" aria-labelledby="winter-title">
        <Link
          href="/products?sort=newest"
          className="winter-cover editorial-photo"
        >
          <Image
            src="/campaigns/winter-layers.webp"
            alt="Taş merdivenlerde kaban, triko ve jean ile kış stili; temsili çekim"
            fill
            sizes="(max-width: 650px) 100vw, 50vw"
          />
          <span className="photo-caption">
            SOĞUK HAVALAR, SICAK DOKULAR <Icon name="arrow" width={22} />
          </span>
        </Link>
        <div className="winter-story">
          <div className="winter-heading">
            <h2 id="winter-title">
              Kışa
              <br />
              kendi tarzında
              <br />
              <em>gir.</em>
            </h2>
            <p>
              Şehrin temposu değişir. Senin tavrın değişmez. Üst üste giy,
              dışarı çık, mevsimi kendine uydur.
            </p>
            <Link className="text-link" href="/products?sort=newest">
              Yeni sezonu keşfet <Icon name="arrow" width={18} />
            </Link>
          </div>
          <div className="winter-details">
            <Link
              href="/products?q=ceket"
              className="winter-detail editorial-photo"
            >
              <Image
                src="/campaigns/winter-city.webp"
                alt="Zeytin yeşili bomber ceketle erkek manken; temsili çekim"
                fill
                sizes="(max-width: 650px) 50vw, 23vw"
                className="winter-man"
              />
              <span className="photo-caption">
                Dışarıda hayat var <Icon name="arrow" width={18} />
              </span>
            </Link>
            <Link
              href="/products?q=triko"
              className="winter-detail editorial-photo"
            >
              <Image
                src="/campaigns/winter-layers.webp"
                alt="Kabanın altında krem rengi dokulu triko; temsili çekim"
                fill
                sizes="(max-width: 650px) 50vw, 23vw"
                className="winter-texture"
              />
              <span className="photo-caption">
                Katman katman <Icon name="arrow" width={18} />
              </span>
            </Link>
          </div>
        </div>
        <p className="editorial-disclaimer">
          {BRAND_NAME} stil günlüğü · Yapay zekâ ile üretilmiş temsili çekimler.
          Ürün detayları katalogda.
        </p>
      </section>
      <section className="home-section wrap">
        <div className="section-heading">
          <div>
            <h2>Öne Çıkan Ürünler</h2>
            <p>Seçiminizi kolaylaştıran, özenle seçilmiş parçalar.</p>
          </div>
          <Link href="/products?featured=1" className="text-link">
            Tümünü Gör
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        <ProductGrid products={featured.slice(0, 4)} />
      </section>
      <section className="denim-editorial" aria-labelledby="denim-title">
        <div className="denim-copy">
          <h2 id="denim-title">
            Bir jean.
            <br />
            <em>Bin ihtimal.</em>
          </h2>
          <p>
            Sabahın ilk kahvesinden şehrin son ışıklarına.
            <br />
            Her plana uyan parçaları keşfet.
          </p>
          <Link className="campaign-cta" href="/products?q=jean">
            Jean dünyasına gir <Icon name="arrow" width={20} />
          </Link>
          <span className="denim-note">
            Kendi yolunu çiz. Kendi stilini giy.
          </span>
        </div>
        <div className="denim-photo editorial-photo">
          <Image
            src="/campaigns/denim-city.webp"
            alt="Jean ve ceketle erkek manken; temsili şehir stili"
            fill
            sizes="(max-width: 650px) 100vw, 55vw"
          />
          <span className="denim-photo-label">{BRAND_WORDMARK} / DENIM</span>
          <span className="photo-credit">Stil ilhamı · Temsili görsel</span>
        </div>
      </section>
      <section className="home-section wrap">
        <div className="section-heading">
          <div>
            <h2>Yeni Gelenler</h2>
            <p>Koleksiyona en son katılanlarla tanışın.</p>
          </div>
          <Link href="/products?sort=newest" className="text-link">
            Tümünü Gör
            <Icon name="arrow" width={16} />
          </Link>
        </div>
        <ProductGrid products={newest.slice(0, 4)} />
      </section>
      <section className="benefits wrap" aria-label="Alışveriş avantajları">
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
