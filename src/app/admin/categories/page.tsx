import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin-controls";
export default async function Categories() {
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <p className="eyebrow">Your studio / Organisation</p>
      <h1>Categories</h1>
      <div className="editor">
        <section className="panel">
          <h2>The collection, organised.</h2>
          {categories.length ? (
            categories.map((c) => (
              <div className="stock-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <small>/{c.slug}</small>
                </div>
                <span>{c._count.products} products</span>
              </div>
            ))
          ) : (
            <p className="muted">
              Create your first category to organise products.
            </p>
          )}
        </section>
        <CategoryForm />
      </div>
    </>
  );
}
