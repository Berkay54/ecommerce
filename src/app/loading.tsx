import { BRAND_NAME } from "@/lib/brand";

export default function Loading() {
  return (
    <main className="wrap empty" role="status">
      <p className="eyebrow">{BRAND_NAME}</p>
      <h2>Ürünler yükleniyor…</h2>
    </main>
  );
}
