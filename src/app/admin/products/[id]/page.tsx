import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/catalog";
import { ProductForm } from "@/components/product-form";
import { DeleteProduct } from "@/components/admin-controls";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <p className="eyebrow">Catalogue / Edit product</p>
      <h1>{product.name}</h1>
      <ProductForm
        categories={categories}
        product={{
          ...product,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() ?? "",
          images: product.images.map((i) => i.url).join("\n"),
          variants: product.variants.map(({ id, name, sku, stock }) => ({
            id,
            name,
            sku,
            stock,
          })),
        }}
      />
      <section className="delete-zone">
        <h2>Remove from the collection</h2>
        <p className="muted">
          Deletion is permanent. Products in carts or orders must be made
          inactive instead.
        </p>
        <DeleteProduct id={id} />
      </section>
    </>
  );
}
