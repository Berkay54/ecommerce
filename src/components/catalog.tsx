import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { type CatalogProduct, money } from "@/lib/catalog";
import {
  HeaderActions,
  MobileMenu,
  FavoriteButton,
} from "@/components/store-actions";
import { Icon } from "@/components/icons";
import { AccountMenu, MobileAccountLinks } from "@/components/account-menu";
import { BRAND_NAME, BRAND_WORDMARK } from "@/lib/brand";
import { SearchBox } from "@/components/search-box";
export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return products.length ? (
    <div className="product-grid">
      {products.map((p) => {
        const discount =
          p.comparePrice && Number(p.comparePrice) > Number(p.price)
            ? Math.round((1 - Number(p.price) / Number(p.comparePrice)) * 100)
            : 0;
        const available = p.variants.some((v) => v.stock > 0);
        return (
          <article className="product-card" key={p.id}>
            <div className="product-image">
              <Link href={`/products/${p.slug}`} aria-label={p.name}>
                {p.images[0] ? (
                  <Image
                    src={p.images[0].url}
                    alt={p.images[0].alt || p.name}
                    fill
                    unoptimized
                    sizes="(max-width: 650px) 50vw, (max-width: 1000px) 33vw, 25vw"
                  />
                ) : (
                  <span className="no-image">Görsel hazırlanıyor</span>
                )}
              </Link>
              <FavoriteButton productId={p.id} />
              <div className="product-badges">
                {discount > 0 && (
                  <span className="discount-badge">%{discount} İndirim</span>
                )}
                {p.featured && <span className="image-tag">Öne Çıkan</span>}
              </div>
              {!available && <span className="sold-out">Tükendi</span>}
            </div>
            <div className="product-caption">
              <p className="product-category">
                {p.category?.name ?? "Koleksiyon"}
              </p>
              <Link href={`/products/${p.slug}`}>
                <h3>{p.name}</h3>
              </Link>
              <div className="prices">
                <strong>{money(p.price)}</strong>
                {discount > 0 && p.comparePrice && (
                  <del>{money(p.comparePrice)}</del>
                )}
              </div>
              <span className={`card-stock${available ? "" : " unavailable"}`}>
                {available ? "Stokta" : "Tükendi"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <div className="empty catalog-empty">
      <Icon name="search" width={32} height={32} />
      <h2>Ürün bulunamadı</h2>
      <p>Aradığınız kriterlere uygun ürün bulunamadı.</p>
      <Link href="/products" className="text-link">
        Tüm ürünleri görüntüle
      </Link>
    </div>
  );
}
async function CategoryLinks() {
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return (
    <>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${encodeURIComponent(category.slug)}`}
        >
          {category.name}
        </Link>
      ))}
    </>
  );
}
function NavigationLinks() {
  return (
    <>
      <Link href="/">Ana Sayfa</Link>
      <Link href="/products?sort=newest">Yeni Gelenler</Link>
      <Link href="/products?sort=popular">Çok Satanlar</Link>
      <Link href="/products?campaign=1">Kampanyalar</Link>
      <Link href="/kategoriler">Kategoriler</Link>
      <Suspense fallback={null}>
        <CategoryLinks />
      </Suspense>
    </>
  );
}
export function StoreHeader() {
  return (
    <header className="store-header">
      <div className="information-bar">
        <div className="wrap">
          <span>750 TL ve üzeri alışverişlerde ücretsiz kargo</span>
          <div>
            <Link href="/bilgi/iade">Kolay İade</Link>
            <span>Güvenli Ödeme</span>
          </div>
        </div>
      </div>
      <div className="wrap header-main">
        <MobileMenu>
          <NavigationLinks />
          <Suspense fallback={null}>
            <MobileAccountLinks />
          </Suspense>
        </MobileMenu>
        <Link href="/" className="brand" aria-label={`${BRAND_NAME} ana sayfa`}>
          {BRAND_WORDMARK}
        </Link>
        <SearchBox />
        <HeaderActions
          account={
            <Suspense
              fallback={
                <Link
                  href="/giris"
                  className="header-action"
                  aria-label="Hesabım"
                >
                  <Icon name="user" />
                  <span>Giriş Yap</span>
                </Link>
              }
            >
              <AccountMenu />
            </Suspense>
          }
        />
      </div>
      <nav className="category-navigation" aria-label="Kategoriler">
        <div className="wrap">
          <NavigationLinks />
        </div>
      </nav>
    </header>
  );
}
export function StoreFooter() {
  const groups = [
    {
      title: "Kurumsal",
      links: [
        ["Hakkımızda", "hakkimizda"],
        ["İletişim", "iletisim"],
        ["Mağazalar", "magazalar"],
      ],
    },
    {
      title: "Yardım",
      links: [
        ["Sıkça Sorulan Sorular", "sss"],
        ["Kargo ve Teslimat", "kargo"],
        ["İade ve Değişim", "iade"],
      ],
    },
    {
      title: "Yasal",
      links: [
        ["Gizlilik Politikası", "gizlilik"],
        ["KVKK", "kvkk"],
        ["Mesafeli Satış Sözleşmesi", "satis-sozlesmesi"],
        ["Çerez Politikası", "cerezler"],
      ],
    },
  ];
  return (
    <footer className="store-footer">
      <div className="wrap footer-grid">
        <div>
          <Link
            href="/"
            className="brand"
            aria-label={`${BRAND_NAME} ana sayfa`}
          >
            {BRAND_WORDMARK}
          </Link>
          <p>
            Günlük hayatınıza iyi gelen
            <br />
            özenle seçilmiş parçalar.
          </p>
          <Link href="/admin" className="text-link">
            Yönetim Paneli
          </Link>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map(([name, slug]) => (
                <li key={slug}>
                  <Link href={`/bilgi/${slug}`}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="newsletter">
          <h2>Kampanyalardan haberdar olun</h2>
          <p>Yeni koleksiyonlar ve mağaza haberleri.</p>
          <label htmlFor="newsletter-email" className="sr-only">
            E-posta adresiniz
          </label>
          <div>
            <input
              id="newsletter-email"
              type="email"
              placeholder="E-posta adresiniz"
              disabled
            />
            <button className="button" disabled>
              Kaydol
            </button>
          </div>
          <small>Bülten kaydı yakında kullanıma açılacak.</small>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p>© 2026 {BRAND_NAME}. Tüm hakları saklıdır.</p>
        <span>Özenle seçin, keyifle kullanın.</span>
      </div>
    </footer>
  );
}
