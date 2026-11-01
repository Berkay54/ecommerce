import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import AccountLoading from "@/app/(store)/hesabim/loading";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/catalog";
import { orderDate, orderStatuses } from "@/lib/order-display";
type MyOrdersProps = {
  searchParams: Promise<{ page?: string }>;
};
export default function MyOrders(props: MyOrdersProps) {
  return (
    <Suspense fallback={<AccountLoading />}>
      <MyOrdersContent {...props} />
    </Suspense>
  );
}
async function MyOrdersContent({ searchParams }: MyOrdersProps) {
  const user = await requireUser("/hesabim/siparisler");
  await connection();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1)) | 0;
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    skip: (page - 1) * 20,
    select: { orderNumber: true, total: true, status: true, createdAt: true },
  });
  return (
    <section>
      <h2>Siparişlerim</h2>
      {orders.length ? (
        <div className="order-history">
          {orders.map((order) => (
            <Link
              href={`/orders/${order.orderNumber}`}
              className="panel order-history-row"
              key={order.orderNumber}
            >
              <div>
                <strong>{order.orderNumber}</strong>
                <p>{orderDate(order.createdAt)}</p>
              </div>
              <span className="status live">{orderStatuses[order.status]}</span>
              <strong>{money(order.total)}</strong>
              <span className="text-link">Detayları Gör</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Henüz siparişiniz yok</h3>
          <p>Koleksiyonu keşfedip ilk siparişinizi oluşturabilirsiniz.</p>
          <Link className="button" href="/products">
            Ürünleri Keşfet
          </Link>
        </div>
      )}
      <nav className="pagination" aria-label="Sipariş sayfaları">
        {page > 1 && (
          <Link href={`/hesabim/siparisler?page=${page - 1}`}>Önceki</Link>
        )}
        {orders.length === 20 && (
          <Link href={`/hesabim/siparisler?page=${page + 1}`}>Sonraki</Link>
        )}
      </nav>
    </section>
  );
}
