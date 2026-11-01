import { StoreHeader, StoreFooter } from "@/components/catalog";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart";
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreHeader />
      {children}
      <CartDrawer />
      <StoreFooter />
    </CartProvider>
  );
}
