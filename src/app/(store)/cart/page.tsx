import { CartContents } from "@/components/cart";
import Link from "next/link";
export const metadata = { title: "Sepetim · Form & Field" };
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
