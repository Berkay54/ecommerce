export function siteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function publicIndexing() {
  return process.env.STORE_PUBLIC_INDEXING === "true" && !!siteOrigin();
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
