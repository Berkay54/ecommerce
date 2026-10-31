import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money, productInclude } from "@/lib/catalog";
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });
  if (!p) notFound();
  return (
    <main className="wrap">
      <nav className="breadcrumb">
        <Link href="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="detail">
        <div className="gallery">
          {p.images.length ? (
            p.images.map((image) => (
              <div className="detail-image" key={image.id}>
                <Image
                  src={image.url}
                  alt={image.alt || p.name}
                  fill
                  unoptimized
                  sizes="(max-width: 800px) 100vw, 60vw"
                />
              </div>
            ))
          ) : (
            <div className="detail-image no-image">Photography coming soon</div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {p.category?.name ?? "The collection"}
            {p.featured ? " / Selected" : ""}
          </p>
          <h1>{p.name}</h1>
          <p className="detail-price">
            {money(p.price)}{" "}
            {p.comparePrice && <del>{money(p.comparePrice)}</del>}
          </p>
          <p className="description">
            {p.description ||
              "A new addition to the collection. More details coming soon."}
          </p>
          <div className="availability">
            <p className="eyebrow">Availability</p>
            {p.variants.length ? (
              p.variants.map((v) => (
                <div className="stock-row" key={v.id}>
                  <div>
                    <strong>{v.name}</strong>
                    <small>SKU {v.sku}</small>
                  </div>
                  <div>
                    {v.price && <span>{money(v.price)} / </span>}
                    {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                  </div>
                </div>
              ))
            ) : (
              <p>Out of stock</p>
            )}
          </div>
          <p className="muted">Online ordering is coming soon.</p>
          <Link className="text-link" href="/products">
            Continue exploring
          </Link>
        </div>
      </div>
    </main>
  );
}
