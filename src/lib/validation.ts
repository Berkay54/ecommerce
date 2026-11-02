import { isLocalProductImage } from "@/lib/images";

export class ValidationError extends Error {}
const fieldLabels: Record<string, string> = {
  name: "Ad",
  slug: "URL kısa adı",
  description: "Açıklama",
  price: "Fiyat",
  comparePrice: "Eski fiyat",
  categoryId: "Kategori",
  images: "Görseller",
};
export function text(data: FormData, key: string, max = 200) {
  const value = data.get(key);
  if (typeof value !== "string" || value.length > max)
    throw new ValidationError(
      `${fieldLabels[key] ?? "Alan"} geçersiz (en fazla ${max} karakter).`,
    );
  return value.trim();
}
export function required(data: FormData, key: string, max = 200) {
  const value = text(data, key, max);
  if (!value)
    throw new ValidationError(
      `${fieldLabels[key] ?? "Alan"} alanı zorunludur.`,
    );
  return value;
}
export function slug(value: string) {
  const result = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!result || result.length > 180)
    throw new ValidationError(
      "Harf ve rakamlardan oluşan geçerli bir URL kısa adı girin.",
    );
  return result;
}
export function amount(value: string, label: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value))
    throw new ValidationError(
      `${label}, en fazla iki ondalık basamak içeren sıfır veya pozitif bir tutar olmalıdır.`,
    );
  return value;
}
export function stock(value: string) {
  if (!/^\d+$/.test(value) || Number(value) > 2147483647)
    throw new ValidationError(
      "Stok, 0 ile 2147483647 arasında bir tam sayı olmalıdır.",
    );
  return Number(value);
}
export function imageUrls(value: string) {
  const urls = value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (urls.length > 20)
    throw new ValidationError("En fazla 20 görsel adresi ekleyin.");
  for (const value of urls) {
    if (isLocalProductImage(value)) continue;
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new ValidationError("Her görsel için geçerli bir adres girin.");
    }
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new ValidationError(
        "Görsel adresleri kullanıcı bilgisi içermeyen HTTP veya HTTPS adresleri olmalıdır.",
      );
  }
  return urls;
}

export function productImages(
  value: string,
): import("@/lib/images").ProductImageValue[] {
  let rows: unknown;
  try {
    rows = JSON.parse(value);
  } catch {
    throw new ValidationError(
      "Görsel listesi geçersiz. Düzenleyiciyi yenileyip tekrar deneyin.",
    );
  }
  if (!Array.isArray(rows) || rows.length > 20)
    throw new ValidationError("En fazla 20 görsel ekleyin.");
  return (rows as unknown[]).map((row) => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("url" in row) ||
      !("alt" in row) ||
      typeof row.url !== "string" ||
      row.url.length > 2000 ||
      typeof row.alt !== "string" ||
      row.alt.length > 300
    )
      throw new ValidationError(
        "Her görsel için geçerli bir adres ve en fazla 300 karakterlik alternatif metin girin.",
      );
    const [url] = imageUrls(row.url);
    if (!url || row.url.trim() !== url || /[\r\n]/.test(row.url))
      throw new ValidationError("Her görsel için yalnızca bir adres girin.");
    return { url, alt: row.alt.trim() };
  });
}
