import Link from "next/link";
import Image from "next/image";
import { CatalogProduct, money } from "@/lib/catalog";
export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return products.length ? (
    <div className="product-grid">
      {products.map((p) => (
        <Link className="product-card" href={`/products/${p.slug}`} key={p.id}>
          <div className="product-image">
            {p.images[0] ? (
              <Image
                src={p.images[0].url}
                alt={p.images[0].alt || p.name}
                fill
                unoptimized
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              />
            ) : (
              <span className="no-image">Photography coming soon</span>
            )}
            {p.featured && <span className="image-tag">Selected</span>}
          </div>
          <div className="product-caption">
            <div>
              <p className="eyebrow">{p.category?.name ?? "The collection"}</p>
              <h3>{p.name}</h3>
            </div>
            <div className="prices">
              {money(p.price)}
              {p.comparePrice && <del>{money(p.comparePrice)}</del>}
            </div>
          </div>
          <p className="muted">
            {p.variants.reduce((sum, v) => sum + v.stock, 0) > 0
              ? "Available"
              : "Out of stock"}{" "}
            <span aria-hidden="true">
              &#8599;
            </span>
          </p>
        </Link>
      ))}
    </div>
  ) : (
    <div className="empty">
      <p className="eyebrow">A little anticipation</p>
      <h2>Something good is on its way.</h2>
      <p>There are no products in this collection yet. Check back soon.</p>
      <Link href="/products" className="text-link">
        Explore all products
      </Link>
    </div>
  );
}
export function StoreHeader() {
  return (
    <header className="site-header wrap">
      <Link href="/" className="brand">
        FORM<span>&</span>FIELD
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/products">The collection</Link>
        <Link href="/admin">Studio admin</Link>
      </nav>
    </header>
  );
}
