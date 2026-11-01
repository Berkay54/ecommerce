import { requireAdmin } from "@/lib/auth-user";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
export default function NewProduct() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewProductContent />
    </Suspense>
  );
}
async function NewProductContent() {
  await requireAdmin();
  await connection();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <>
      <p className="eyebrow">Ürünler / Yeni Ürün</p>
      <h1>Yeni Ürün</h1>
      <ProductForm categories={categories} />
    </>
  );
}
