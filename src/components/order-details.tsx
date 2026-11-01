import Link from "next/link";
import { money } from "@/lib/catalog";
import { orderDate, orderStatuses } from "@/lib/order-display";
import type { OrderDetail } from "@/lib/order-service";
import { returnStatuses } from "@/lib/fulfillment";
import { ReturnForm, AdminReturnForm } from "@/components/fulfillment-forms";
export function OrderDetails({
  order,
  admin = false,
}: {
  order: OrderDetail;
  admin?: boolean;
}) {
  const snapshot = order.shippingAddress;
  const delivery = (
    key:
      "fullName" | "phone" | "city" | "district" | "addressLine" | "postalCode",
  ) =>
    snapshot &&
    typeof snapshot === "object" &&
    !Array.isArray(snapshot) &&
    typeof snapshot[key] === "string"
      ? snapshot[key]
      : order.address[key];
  return (
    <>
      <div className="panel order-overview">
        <div>
          <span className="muted">Sipariş Numarası</span>
          <h2>{order.orderNumber}</h2>
          <p>{orderDate(order.createdAt)}</p>
        </div>
        <span className="status live">{orderStatuses[order.status]}</span>
      </div>
      {order.status === "PENDING" && (
        <p className="notice">
          {order.payment?.status === "REVIEW"
            ? "Ödeme bildirimi inceleme bekliyor. Yeniden ödeme yapmayın; mağazayla iletişime geçin."
            : "Siparişiniz alındı. Ödemesi henüz onaylanmadı."}
          {order.payment && !admin && (
            <>
              <br />
              <Link
                className="text-link"
                href={`/odeme/sonuc/${order.payment.id}`}
              >
                Ödeme Durumunu Görüntüle
              </Link>
            </>
          )}
        </p>
      )}
      {admin && order.payment && (
        <section className="panel">
          <h2>iyzico Sandbox Ödemesi</h2>
          <p>
            Ödeme durumu:{" "}
            {
              {
                CREATED: "Başlatılmadı",
                INITIALIZING: "Başlatılıyor / sonuç belirsiz",
                READY: "Ödeme bekleniyor",
                SUCCEEDED: "Ödeme doğrulandı",
                FAILED: "Ödeme tamamlanamadı",
                REVIEW: "İnceleme gerekiyor",
              }[order.payment.status]
            }
          </p>
          <p>iyzico ödeme ID: {order.payment.paymentId ?? "—"}</p>
          <p>
            Ödeme zamanı:{" "}
            {order.payment.paidAt
              ? new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Europe/Istanbul",
                }).format(order.payment.paidAt)
              : "—"}
          </p>
          {order.payment.status === "REVIEW" && (
            <p className="notice error">
              Ödeme bildirimi alındı ancak stok veya risk kontrolü
              tamamlanamadı. Siparişi sevk etmeyin; iyzico panelinden inceleyin.
              Otomatik iade uygulanmaz.
            </p>
          )}
        </section>
      )}
      {order.trackingNumber && (
        <section className="panel">
          <h2>Kargo Takibi</h2>
          <p>
            <strong>{order.shippingCarrier}</strong>
          </p>
          <p>
            Takip numarası:{" "}
            <strong className="tracking-number">{order.trackingNumber}</strong>
          </p>
          <p className="muted">
            Gönderinizi kargo firmasının takip ekranında bu numarayla
            sorgulayabilirsiniz.
          </p>
        </section>
      )}
      {order.returns.map((request) => (
        <section className="panel" key={request.id}>
          <h2>İade Talebi · {returnStatuses[request.status]}</h2>
          <p className="review-comment">{request.reason}</p>
          {request.adminNote && (
            <p className="notice review-comment">
              Mağaza açıklaması: {request.adminNote}
            </p>
          )}
          {admin && (
            <AdminReturnForm
              key={`${request.id}-${request.status}`}
              id={request.id}
              status={request.status}
            />
          )}
        </section>
      ))}
      {!admin && order.status === "DELIVERED" && !order.returns.length && (
        <ReturnForm id={order.id} />
      )}
      <div className="order-detail-layout">
        <section className="panel">
          <h2>Sipariş Ürünleri</h2>
          {order.items.map((item) => (
            <div key={item.id} className="checkout-item">
              <div>
                <Link href={`/products/${item.product.slug}`}>
                  <strong>{item.productName ?? item.product.name}</strong>
                </Link>
                <p>
                  {item.variantName ?? item.variant?.name ?? "Standart"}
                  <br />
                  {item.quantity} adet · Birim fiyat: {money(item.price)}
                </p>
              </div>
              <strong>{money(item.price.mul(item.quantity))}</strong>
            </div>
          ))}
          <div className="order-total">
            <strong>Toplam</strong>
            <strong>{money(order.total)}</strong>
          </div>
          <p className="muted">
            Toplam ürün bedelidir; bu aşamada kargo bedeli hesaplanmamıştır.
          </p>
        </section>
        <aside className="panel">
          <h2>Teslimat Adresi</h2>
          <p>
            {delivery("fullName")}
            <br />
            {delivery("addressLine")}
            <br />
            {delivery("district")} / {delivery("city")} {delivery("postalCode")}
            <br />
            {delivery("phone")}
          </p>
          {admin && (
            <>
              <h2>Müşteri</h2>
              <p>
                {order.user.name || "İsimsiz hesap"}
                <br />
                {order.user.email}
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
