import { requireAdmin } from "@/lib/auth-user";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin-controls";
export default function Categories() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CategoriesContent />
    </Suspense>
  );
}
async function CategoriesContent() {
  await requireAdmin();
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <p className="eyebrow">Yönetim Paneli / Kategoriler</p>
      <h1>Kategoriler</h1>
      <div className="editor">
        <section className="panel">
          <h2>Kategori Listesi</h2>
          {categories.length ? (
            categories.map((c) => (
              <div className="stock-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <small>/{c.slug}</small>
                </div>
                <span>{c._count.products} ürün</span>
              </div>
            ))
          ) : (
            <p className="muted">
              Ürünlerinizi düzenlemek için ilk kategorinizi oluşturun.
            </p>
          )}
        </section>
        <CategoryForm />
      </div>
    </>
  );
}
