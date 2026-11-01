import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { emailConfiguration } from "@/lib/order-notifications";
import { NotificationRetry } from "@/components/fulfillment-forms";
const labels = {
  PENDING: "Bekliyor",
  SENDING: "Gönderiliyor",
  SENT: "Sağlayıcıya iletildi",
  FAILED: "Yeniden denenecek",
  REVIEW: "Manuel inceleme gerekiyor",
};
export default function Notifications() {
  return (
    <Suspense fallback={<p>Bildirimler yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  await connection();
  const notifications = await prisma.orderNotification.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true } } },
    take: 100,
  });
  return (
    <>
      <h1>Sipariş Bildirimleri</h1>
      <p className="notice">
        {emailConfiguration()
          ? "Gönderim açık. Bu ekran sağlayıcıya iletim durumunu gösterir; gelen kutusuna teslim garantisi değildir."
          : "Gerçek e-posta gönderimi kapalı. Resend, gönderen alan adı ve ortam değişkenlerini yapılandırın."}
      </p>
      <NotificationRetry />
      <p className="muted">
        İlk gönderimden sonra 23 saati geçen belirsiz kayıtlar otomatik
        gönderilmez; sağlayıcı panelinden mutabakat gerekir.
      </p>
      {!notifications.length && (
        <div className="empty">
          <h2>Henüz bildirim yok</h2>
        </div>
      )}
      {notifications.map((notification) => (
        <article className="panel" key={notification.id}>
          <span className="status">{labels[notification.status]}</span>
          <h2>{notification.subject}</h2>
          <p>
            {notification.recipient} · {notification.attempts} deneme
          </p>
          {notification.lastError && (
            <p className="notice error">{notification.lastError}</p>
          )}
          <details>
            <summary>İçeriği Göster</summary>
            <p className="review-comment">{notification.body}</p>
          </details>
          <Link
            className="text-link"
            href={`/admin/orders/${notification.orderId}`}
          >
            {notification.order.orderNumber} →
          </Link>
        </article>
      ))}
    </>
  );
}
