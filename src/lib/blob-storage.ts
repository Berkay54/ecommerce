import "server-only";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const PRODUCT_BLOB_PREFIX = "ecommerce/products/";
export function isProductBlob(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${PRODUCT_BLOB_PREFIX}`) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export async function deleteUnreferencedBlob(url: string) {
  if (!isProductBlob(url)) return;
  if (await prisma.productImage.count({ where: { url } })) return;
  await del(url);
}
export async function cleanupProductBlobs(urls: string[]) {
  const results = await Promise.allSettled(
    [...new Set(urls)].map(deleteUnreferencedBlob),
  );
  const failed = results.some((result) => result.status === "rejected");
  if (failed)
    console.error(
      "Product saved, but Blob cleanup failed. Remove unreferenced ecommerce/products files from the Blob dashboard.",
    );
  return !failed;
}
