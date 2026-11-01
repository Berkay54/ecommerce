"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  amount,
  productImages,
  required,
  slug,
  stock,
  text,
  ValidationError,
} from "@/lib/validation";
import { cleanupProductBlobs } from "@/lib/blob-storage";
import { requireAdmin } from "@/lib/auth-user";
export type ActionState = { error?: string; success?: string };
function errorMessage(error: unknown) {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return "Bu URL kısa adı veya stok kodu zaten kullanılıyor. Farklı bir değer girin.";
    if (error.code === "P2025")
      return "Bu kayıt artık mevcut değil. Sayfayı yenileyip tekrar deneyin.";
    if (error.code === "P2003")
      return "Bu ürün bir sepet veya siparişe bağlı. Silmek yerine pasif yapın.";
  }
  console.error(
    "Catalog operation failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return "Değişiklikler kaydedilemedi. Veritabanı bağlantısını kontrol edip tekrar deneyin.";
}
function refresh() {
  revalidatePath("/", "layout");
}
export async function saveProduct(
  id: string | null,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  let removedUrls: string[] = [];
  let cleanupOk = true;
  try {
    const name = required(data, "name");
    const price = amount(required(data, "price"), "Fiyat");
    const compare = text(data, "comparePrice");
    const comparePrice = compare ? amount(compare, "Eski fiyat") : null;
    if (comparePrice && Number(comparePrice) <= Number(price))
      throw new ValidationError(
        "Eski fiyat, satış fiyatından yüksek olmalıdır.",
      );
    const categoryId = text(data, "categoryId") || null;
    const images = productImages(text(data, "images", 60000));
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
      throw new ValidationError("1 ile 100 arasında varyant ekleyin.");
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
        throw new ValidationError(
          "Her varyant için ad, stok kodu ve stok miktarı girin.",
        );
      return {
        id: String(ids[i]),
        name: String(names[i]).trim(),
        sku: sku.trim(),
        stock: stock(String(stocks[i])),
      };
    });
    if (new Set(variants.map((v) => v.sku)).size !== variants.length)
      throw new ValidationError("Her varyantın stok kodu benzersiz olmalıdır.");
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
        throw new ValidationError("Mevcut bir kategori seçin.");
      if (id) {
        const previousImages = await tx.productImage.findMany({
          where: { productId: id },
        });
        removedUrls = previousImages
          .filter((image) => !images.some((next) => next.url === image.url))
          .map((image) => image.url);
        const existing = await tx.productVariant.findMany({
          where: { productId: id },
        });
        if (
          existing.some((v) => !variants.some((row) => row.id === v.id)) ||
          variants.some((v) => v.id && !existing.some((row) => row.id === v.id))
        )
          throw new ValidationError(
            "Varyantlar değişti. Kaydetmeden önce sayfayı yenileyin.",
          );
        await tx.product.update({
          where: { id },
          data: {
            ...values,
            images: {
              deleteMany: {},
              create: images.map(({ url, alt }, sortOrder) => ({
                url,
                sortOrder,
                alt,
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
              create: images.map(({ url, alt }, sortOrder) => ({
                url,
                sortOrder,
                alt,
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
    cleanupOk = await cleanupProductBlobs(removedUrls);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  redirect(`/admin/products?saved=1${cleanupOk ? "" : "&cleanup=1"}`);
}
export async function deleteProduct(
  id: string,
  _state: ActionState,
): Promise<ActionState> {
  void _state;
  await requireAdmin();
  let cleanupOk = true;
  try {
    const deleted = await prisma.product.delete({
      where: { id },
      include: { images: true },
    });
    cleanupOk = await cleanupProductBlobs(
      deleted.images.map((image) => image.url),
    );
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  redirect(`/admin/products?deleted=1${cleanupOk ? "" : "&cleanup=1"}`);
}
export async function createCategory(
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const name = required(data, "name", 100);
    await prisma.category.create({
      data: { name, slug: slug(text(data, "slug") || name) },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  return { success: "Kategori oluşturuldu." };
}
