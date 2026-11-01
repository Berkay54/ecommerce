import { CartContents } from "@/components/cart";
import Link from "next/link";
import { brandTitle } from "@/lib/brand";
export const metadata = { title: brandTitle("Sepetim"), robots: { index: false, follow: false } };
export default function CartPage() {
  return (
    <main className="wrap cart-page">
      <nav className="breadcrumb" aria-label="Sayfa yolu">
        <Link href="/">Ana Sayfa</Link>
        <span>/</span>
        <span>Sepetim</span>
      </nav>
      <h1>Sepetim</h1>
      <CartContents />
    </main>
  );
}
