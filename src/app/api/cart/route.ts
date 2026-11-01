import { prisma } from "@/lib/prisma";
import { cartKey, cents, parseCart, type CartLine } from "@/lib/cart";

export async function POST(request: Request) {
  let items;
  try {
    if (Number(request.headers.get("content-length")) > 40000)
      throw new Error("Sepet verisi izin verilen boyutu aşıyor.");
    const body = await request.text();
    if (body.length > 40000)
      throw new Error("Sepet verisi izin verilen boyutu aşıyor.");
    items = parseCart(JSON.parse(body));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Geçersiz sepet verisi.",
      },
      { status: 400 },
    );
  }
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) }, active: true },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });
    const messages: string[] = [];
    const lines: CartLine[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      // Inventory is held exclusively on variants in this schema. No variants means no purchasable stock.
      if (!product || !variant || variant.stock <= 0) {
        messages.push(
          `${product?.name ?? "Bir ürün"} artık satışa uygun olmadığı için sepetinizden kaldırıldı.`,
        );
        continue;
      }
      const quantity = Math.min(item.quantity, variant.stock);
      if (quantity !== item.quantity)
        messages.push(
          `${product.name} (${variant.name}) adedi mevcut stok nedeniyle ${quantity} olarak güncellendi.`,
        );
      const image = product.images[0];
      lines.push({
        ...item,
        quantity,
        name: product.name,
        slug: product.slug,
        variant: variant.name,
        image: image
          ? { url: image.url, alt: image.alt ?? product.name }
          : null,
        unitPriceCents: cents(variant.price ?? product.price),
        stock: variant.stock,
      });
    }
    // Keys are derived from IDs; titles, prices and stock are always supplied by the database.
    return Response.json(
      {
        lines: [
          ...new Map(lines.map((line) => [cartKey(line), line])).values(),
        ],
        messages,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error(
      "Cart availability check failed",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return Response.json(
      {
        error:
          "Stok kontrol edilemedi. Kayıtlı sepetiniz korundu; lütfen tekrar deneyin.",
      },
      { status: 503 },
    );
  }
}
