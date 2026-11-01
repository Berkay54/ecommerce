export const CART_STORAGE_KEY = "form-field:guest-cart:v1";
export const MAX_CART_LINES = 100;
export type CartInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
};
export type CartLine = CartInput & {
  name: string;
  slug: string;
  variant: string;
  image: { url: string; alt: string } | null;
  unitPriceCents: number;
  stock: number;
};
export type CartResult = { lines: CartLine[]; messages: string[] };
export function cartKey(item: Pick<CartInput, "productId" | "variantId">) {
  return JSON.stringify([item.productId, item.variantId]);
}
export function parseCart(value: unknown): CartInput[] {
  if (!Array.isArray(value) || value.length > MAX_CART_LINES)
    throw new Error("Sepetinize en fazla 100 farklı ürün ekleyebilirsiniz.");
  const merged = new Map<string, CartInput>();
  for (const row of value as unknown[]) {
    if (
      typeof row !== "object" ||
      row === null ||
      !("productId" in row) ||
      !("variantId" in row) ||
      !("quantity" in row) ||
      typeof row.productId !== "string" ||
      !row.productId ||
      row.productId.length > 100 ||
      !(
        row.variantId === null ||
        (typeof row.variantId === "string" &&
          row.variantId.length > 0 &&
          row.variantId.length <= 100)
      ) ||
      typeof row.quantity !== "number" ||
      !Number.isSafeInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 2147483647
    )
      throw new Error(
        "Kayıtlı sepette geçersiz bir ürün var. Sepeti temizleyip tekrar deneyin.",
      );
    const item: CartInput = {
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
    };
    const key = cartKey(item);
    const previous = merged.get(key);
    merged.set(key, {
      ...item,
      quantity: Math.min(2147483647, item.quantity + (previous?.quantity ?? 0)),
    });
  }
  return [...merged.values()];
}
export function cartInputs(lines: CartInput[]): CartInput[] {
  return lines.map(({ productId, variantId, quantity }) => ({
    productId,
    variantId,
    quantity,
  }));
}
export function cents(value: { toString(): string }) {
  const [whole, fraction = ""] = value.toString().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}
export function cartMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value / 100);
}
