import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap empty">
      <p className="eyebrow">404 / Sayfa Bulunamadı</p>
      <h1>Aradığınız sayfa bulunamadı</h1>
      <Link href="/products" className="button">
        Ürünleri Keşfet
      </Link>
    </main>
  );
}
