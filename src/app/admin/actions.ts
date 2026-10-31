"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  amount,
  imageUrls,
  required,
  slug,
  stock,
  text,
  ValidationError,
} from "@/lib/validation";
export type ActionState = { error?: string; success?: string };
function errorMessage(error: unknown) {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return "That slug or SKU is already in use. Choose a unique value.";
    if (error.code === "P2025")
      return "This record no longer exists. Refresh and try again.";
    if (error.code === "P2003")
      return "This product is referenced by a cart or order. Set it inactive instead.";
  }
  console.error(
    "Catalog operation failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return "Unable to save changes. Check the database connection and try again.";
}
function refresh() {
  revalidatePath("/", "layout");
}
export async function saveProduct(
  id: string | null,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const name = required(data, "name");
    const price = amount(required(data, "price"), "Price");
    const compare = text(data, "comparePrice");
    const comparePrice = compare ? amount(compare, "Compare price") : null;
    if (comparePrice && Number(comparePrice) <= Number(price))
      throw new ValidationError("Compare price must be greater than price.");
    const categoryId = text(data, "categoryId") || null;
    const urls = imageUrls(text(data, "images", 40000));
    const ids = data.getAll("variantId");
    const names = data.getAll("variantName");
    const skus = data.getAll("sku");
    const stocks = data.getAll("stock");
    if (
      !skus.length ||
      skus.length > 100 ||
      names.length !== skus.length ||
      stocks.length !== skus.length ||
      ids.length !== skus.length
    )
      throw new ValidationError("Provide between 1 and 100 variants.");
    const variants = skus.map((sku, i) => {
      if (
        typeof sku !== "string" ||
        !sku.trim() ||
        sku.length > 100 ||
        typeof names[i] !== "string" ||
        !String(names[i]).trim() ||
        String(names[i]).length > 100 ||
        typeof stocks[i] !== "string" ||
        typeof ids[i] !== "string"
      )
        throw new ValidationError("Every variant needs a name, SKU and stock.");
      return {
        id: String(ids[i]),
        name: String(names[i]).trim(),
        sku: sku.trim(),
        stock: stock(String(stocks[i])),
      };
    });
    if (new Set(variants.map((v) => v.sku)).size !== variants.length)
      throw new ValidationError("Each variant needs a unique SKU.");
    const values = {
      name,
      slug: slug(text(data, "slug") || name),
      description: text(data, "description", 20000) || null,
      price,
      comparePrice,
      categoryId,
      active: data.get("active") === "on",
      featured: data.get("featured") === "on",
    };
    await prisma.$transaction(async (tx) => {
      if (
        categoryId &&
        !(await tx.category.findUnique({ where: { id: categoryId } }))
      )
        throw new ValidationError("Select an existing category.");
      if (id) {
        const existing = await tx.productVariant.findMany({
          where: { productId: id },
        });
        if (
          existing.some((v) => !variants.some((row) => row.id === v.id)) ||
          variants.some((v) => v.id && !existing.some((row) => row.id === v.id))
        )
          throw new ValidationError(
            "Variants changed. Reload this page before saving.",
          );
        await tx.product.update({
          where: { id },
          data: {
            ...values,
            images: {
              deleteMany: {},
              create: urls.map((url, sortOrder) => ({
                url,
                sortOrder,
                alt: name,
              })),
            },
          },
        });
        for (const variant of variants) {
          const { id: variantId, ...value } = variant;
          if (variantId)
            await tx.productVariant.update({
              where: { id: variantId },
              data: value,
            });
          else
            await tx.productVariant.create({
              data: { ...value, productId: id },
            });
        }
      } else {
        await tx.product.create({
          data: {
            ...values,
            images: {
              create: urls.map((url, sortOrder) => ({
                url,
                sortOrder,
                alt: name,
              })),
            },
            variants: {
              create: variants.map(({ name, sku, stock }) => ({
                name,
                sku,
                stock,
              })),
            },
          },
        });
      }
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  redirect("/admin/products?saved=1");
}
export async function deleteProduct(
  id: string,
  _state: ActionState,
): Promise<ActionState> {
  void _state;
  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  redirect("/admin/products?deleted=1");
}
export async function createCategory(
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const name = required(data, "name", 100);
    await prisma.category.create({
      data: { name, slug: slug(text(data, "slug") || name) },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  return { success: "Category created." };
}
