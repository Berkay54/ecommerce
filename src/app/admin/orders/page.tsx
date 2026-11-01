import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminLoading from "@/app/admin/loading";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/catalog";
import { orderDate, orderStatuses } from "@/lib/order-display";
type AdminOrdersProps = {
  searchParams: Promise<{ page?: string }>;
};
export default function AdminOrders(props: AdminOrdersProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminOrdersContent {...props} />
    </Suspense>
  );
}
async function AdminOrdersContent({ searchParams }: AdminOrdersProps) {
  await requireAdmin();
  await connection();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1)) | 0;
  const orders = await prisma.order.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
    skip: (page - 1) * 30,
  });
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>Siparişler</h1>
          <p>Müşteri siparişlerini inceleyin ve durumlarını yönetin.</p>
        </div>
      </div>
      {orders.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Müşteri</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th>Toplam</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    {order.user.name}
                    <small>{order.user.email}</small>
                  </td>
                  <td>{orderDate(order.createdAt)}</td>
                  <td>
                    <span className="status live">
                      {orderStatuses[order.status]}
                    </span>
                  </td>
                  <td>{money(order.total)}</td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/admin/orders/${order.id}`}
                    >
                      Detayları Gör
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>Henüz sipariş yok</h2>
          <p>Müşteri siparişleri burada listelenecek.</p>
        </div>
      )}
      <nav className="pagination" aria-label="Sipariş sayfaları">
        {page > 1 && (
          <Link href={`/admin/orders?page=${page - 1}`}>Önceki</Link>
        )}
        {orders.length === 30 && (
          <Link href={`/admin/orders?page=${page + 1}`}>Sonraki</Link>
        )}
      </nav>
    </>
  );
}
