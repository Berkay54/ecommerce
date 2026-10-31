import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import Loading from "@/app/loading";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { ProductGrid } from "@/components/catalog";
export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  const products = await prisma.product.findMany({
    where: { active: true },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 6,
  });
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <p className="eyebrow">The everyday, elevated</p>
          <h1>
            Good things.
            <br />
            <em>Well considered.</em>
          </h1>
          <p className="hero-copy">
            Discover a collection with room for your personality. Explore the
            pieces, find your favourites, make them part of your everyday.
          </p>
          <Link href="/products" className="button">
            Explore the collection <span aria-hidden="true">&#8599;</span>
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sculpture" />
          <span>FORM / FUNCTION / FEELING</span>
        </div>
      </section>
      <section className="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A closer look</p>
            <h2>From the collection</h2>
          </div>
          <Link href="/products" className="text-link">
            View everything
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>
    </main>
  );
}
