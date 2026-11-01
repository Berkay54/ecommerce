import { requireAdmin } from "@/lib/auth-user";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { ProductForm } from "@/components/product-form";
import { DeleteProduct } from "@/components/admin-controls";
type EditProductProps = {
  params: Promise<{ id: string }>;
};
export default function EditProduct(props: EditProductProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditProductContent {...props} />
    </Suspense>
  );
}
async function EditProductContent({ params }: EditProductProps) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: productInclude }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();
  return (
    <>
      <p className="eyebrow">Ürünler / Ürünü Düzenle</p>
      <h1>{product.name}</h1>
      <ProductForm
        categories={categories}
        product={{
          ...product,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() ?? "",
          images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
          variants: product.variants.map(({ id, name, sku, stock }) => ({
            id,
            name,
            sku,
            stock,
          })),
        }}
      />
      <section className="delete-zone">
        <h2>Ürünü Sil</h2>
        <p className="muted">
          Silme işlemi geri alınamaz. Sepet veya siparişe bağlı ürünleri silmek
          yerine pasif yapın.
        </p>
        <DeleteProduct id={id} />
      </section>
    </>
  );
}
