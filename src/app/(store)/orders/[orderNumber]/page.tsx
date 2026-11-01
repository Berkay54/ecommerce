import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { orderInclude } from "@/lib/order-service";
import { OrderDetails } from "@/components/order-details";
import { PaymentCartSettlement } from "@/components/payment-result";
export const metadata = { title: "Sipariş Detayı · Form & Field" };
type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
};
export default function OrderPage(props: OrderPageProps) {
  return (
    <Suspense
      fallback={
        <main className="wrap order-page" role="status">
          <p>Sipariş bilgileri yükleniyor…</p>
        </main>
      }
    >
      <OrderContent {...props} />
    </Suspense>
  );
}
async function OrderContent({ params }: OrderPageProps) {
  const user = await requireUser("/hesabim/siparisler");
  await connection();
  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: orderInclude,
  });
  if (!order) notFound();
  return (
    <main className="wrap order-page">
      <h1>
        {order.status === "PENDING" ? "Siparişiniz Alındı" : "Sipariş Detayı"}
      </h1>
      <OrderDetails order={order} />
      {order.payment?.status === "SUCCEEDED" && (
        <PaymentCartSettlement id={order.payment.id} succeeded />
      )}
      <div className="account-shortcuts">
        <Link href="/hesabim/siparisler" className="button">
          Siparişlerim
        </Link>
        <Link href="/products" className="button secondary">
          Alışverişe Devam Et
        </Link>
      </div>
    </main>
  );
}
