import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { returnStatuses } from "@/lib/fulfillment";
export default function Returns() {
  return (
    <Suspense fallback={<p>İadeler yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  await connection();
  const requests = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          user: { select: { email: true } },
        },
      },
    },
    take: 100,
  });
  return (
    <>
      <h1>İade Talepleri</h1>
      {!requests.length && (
        <div className="empty">
          <h2>Henüz iade talebi yok</h2>
        </div>
      )}
      {requests.map((request) => (
        <article className="panel" key={request.id}>
          <span className="status">{returnStatuses[request.status]}</span>
          <h2>{request.order.orderNumber}</h2>
          <p>{request.order.user.email}</p>
          <p className="review-comment">{request.reason}</p>
          <Link className="text-link" href={`/admin/orders/${request.orderId}`}>
            Talebi ve Siparişi İncele →
          </Link>
        </article>
      ))}
    </>
  );
}
