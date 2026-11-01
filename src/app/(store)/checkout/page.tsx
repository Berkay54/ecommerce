import { requireUser } from "@/lib/auth-user";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Checkout } from "@/components/checkout";
import { paymentConfig } from "@/lib/payment-validation";
import { brandTitle } from "@/lib/brand";
export const metadata = { title: brandTitle("Siparişi Tamamla"), robots: { index: false, follow: false } };
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="wrap checkout-page" role="status">
          <p>Sipariş bilgileri yükleniyor…</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
async function CheckoutContent() {
  const user = await requireUser("/checkout");
  await connection();
  let paymentAvailable = true;
  try {
    paymentConfig();
  } catch {
    paymentAvailable = false;
  }
  const addresses = await prisma.address.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fullName: true,
      phone: true,
      city: true,
      district: true,
      addressLine: true,
      postalCode: true,
    },
  });
  return (
    <main className="wrap checkout-page">
      <h1>Siparişi Tamamla</h1>
      <p className="muted">
        Teslimat adresinizi seçin, ürünlerinizi kontrol edin ve siparişinizi
        güvenli sandbox ödeme sayfasına geçin.
      </p>
      <Checkout addresses={addresses} paymentAvailable={paymentAvailable} />
    </main>
  );
}
