import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
export default async function NewProduct() {
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <>
      <p className="eyebrow">Catalogue / New product</p>
      <h1>A new addition.</h1>
      <ProductForm categories={categories} />
    </>
  );
}
