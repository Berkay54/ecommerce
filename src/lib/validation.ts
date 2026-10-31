export class ValidationError extends Error {}
export function text(data: FormData, key: string, max = 200) {
  const value = data.get(key);
  if (typeof value !== "string" || value.length > max)
    throw new ValidationError(`Invalid ${key} (maximum ${max} characters).`);
  return value.trim();
}
export function required(data: FormData, key: string, max = 200) {
  const value = text(data, key, max);
  if (!value) throw new ValidationError(`${key} is required.`);
  return value;
}
export function slug(value: string) {
  const result = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!result || result.length > 180)
    throw new ValidationError("Enter a valid slug using letters and numbers.");
  return result;
}
export function amount(value: string, label: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value))
    throw new ValidationError(
      `${label} must be a non-negative amount with at most two decimal places.`,
    );
  return value;
}
export function stock(value: string) {
  if (!/^\d+$/.test(value) || Number(value) > 2147483647)
    throw new ValidationError(
      "Stock must be a whole number between 0 and 2147483647.",
    );
  return Number(value);
}
export function imageUrls(value: string) {
  const urls = value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (urls.length > 20) throw new ValidationError("Use at most 20 image URLs.");
  for (const value of urls) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new ValidationError("Each image must have a valid URL.");
    }
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new ValidationError(
        "Image URLs must use HTTP or HTTPS without credentials.",
      );
  }
  return urls;
}
