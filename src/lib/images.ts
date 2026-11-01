export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PRODUCT_IMAGES = 20;
export type ProductImageValue = { url: string; alt: string };
export function imageFileError(file: Pick<File, "type" | "size">) {
  if (!IMAGE_TYPES.includes(file.type))
    return "JPEG, PNG veya WebP biçiminde bir görsel seçin.";
  if (!file.size || file.size > MAX_IMAGE_BYTES)
    return "Her görsel 1 bayt ile 3 MB arasında olmalıdır.";
  return null;
}
