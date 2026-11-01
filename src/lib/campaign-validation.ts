import { ValidationError, required, text } from "@/lib/validation";
export function campaignValues(data: FormData) {
  const href = required(data, "href", 1000);
  const url = new URL(href, "https://store.invalid");
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.includes("\\") ||
    url.origin !== "https://store.invalid" ||
    !/^\/(products|kategoriler|bilgi)(\/|$)/.test(url.pathname)
  )
    throw new ValidationError(
      "Bağlantı /products, /kategoriler veya /bilgi ile başlayan mağaza içi bir adres olmalıdır.",
    );
  const image = required(data, "image", 2000);
  if (!/^\/campaigns\/[a-zA-Z0-9_-]+\.webp$/.test(image)) {
    let imageUrl: URL;
    try {
      imageUrl = new URL(image);
    } catch {
      throw new ValidationError("Geçerli bir HTTPS görsel adresi girin.");
    }
    if (
      imageUrl.protocol !== "https:" ||
      imageUrl.username ||
      imageUrl.password
    )
      throw new ValidationError("Görsel HTTPS adresi olmalıdır.");
  }
  const theme = required(data, "theme");
  if (!["forest", "sand", "wine"].includes(theme))
    throw new ValidationError("Geçerli bir tema seçin.");
  const sortOrder = Number(required(data, "sortOrder"));
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000)
    throw new ValidationError("Sıra 0–1000 arasında olmalıdır.");
  return {
    label: required(data, "label", 70),
    title: required(data, "title", 32),
    emphasis: required(data, "emphasis", 32),
    description: required(data, "description", 240),
    href,
    action: required(data, "action", 50),
    image,
    alt: required(data, "alt", 300),
    theme,
    note: text(data, "note", 140),
    showDiscount: data.get("showDiscount") === "on",
    active: data.get("active") === "on",
    sortOrder,
  };
}
