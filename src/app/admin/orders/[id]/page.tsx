import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminLoading from "@/app/admin/loading";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { orderInclude } from "@/lib/order-service";
import { OrderDetails } from "@/components/order-details";
import { OrderStatusForm } from "@/components/order-status-form";
type AdminOrderProps = {
  params: Promise<{ id: string }>;
};
export default function AdminOrder(props: AdminOrderProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminOrderContent {...props} />
    </Suspense>
  );
}
async function AdminOrderContent({ params }: AdminOrderProps) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) notFound();
  return (
    <>
      <h1>Sipariş Detayı</h1>
      <OrderDetails order={order} admin />
      <OrderStatusForm
        key={order.status}
        id={order.id}
        status={order.status}
        sandboxPayment={!!order.payment}
        paymentSucceeded={order.payment?.status === "SUCCEEDED"}
      />
    </>
  );
}
