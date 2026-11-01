"use client";
import { useActionState } from "react";
import type { ReturnStatus } from "@prisma/client";
import {
  saveShipment,
  requestReturn,
  updateReturn,
  retryNotifications,
} from "@/app/fulfillment-actions";
import { returnStatuses, returnTransitions } from "@/lib/fulfillment";
function Feedback({ state }: { state: { error?: string; success?: string } }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice">
          {state.success}
        </p>
      )}
    </>
  );
}
export function ShipmentForm({
  id,
  carrier,
  trackingNumber,
}: {
  id: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const [state, action, pending] = useActionState(
    saveShipment.bind(null, id),
    {},
  );
  return (
    <form action={action} className="panel">
      <h2>Kargo Takip Bilgileri</h2>
      <p className="muted">
        Bilgileri kaydedip sipariş durumunu Kargoya Verildi olarak güncelleyin.
      </p>
      <label>
        Kargo Firması
        <input
          name="shippingCarrier"
          required
          maxLength={80}
          defaultValue={carrier ?? ""}
        />
      </label>
      <label>
        Takip Numarası
        <input
          name="trackingNumber"
          required
          minLength={3}
          maxLength={80}
          defaultValue={trackingNumber ?? ""}
        />
      </label>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        Kargo Bilgilerini Kaydet
      </button>
    </form>
  );
}
export function ReturnForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    requestReturn.bind(null, id),
    {},
  );
  return (
    <form action={action} className="panel">
      <h2>İade Talebi Oluştur</h2>
      <p>
        Talep siparişin tamamı için mağazaya iletilir. İncelemeden sonra
        gönderim koşulları paylaşılır. Onay almadan ürün göndermeyin.
      </p>
      <label>
        İade Nedeni
        <textarea
          name="reason"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
        />
      </label>
      <Feedback state={state} />
      <button className="button secondary" disabled={pending}>
        İade Talebi Gönder
      </button>
    </form>
  );
}
export function AdminReturnForm({
  id,
  status,
}: {
  id: string;
  status: ReturnStatus;
}) {
  const [state, action, pending] = useActionState(
    updateReturn.bind(null, id),
    {},
  );
  const choices = returnTransitions[status];
  if (!choices.length) return null;
  return (
    <form action={action}>
      <label>
        Yeni Durum
        <select name="status" required defaultValue="">
          <option value="" disabled>
            Seçin
          </option>
          {choices.map((status) => (
            <option key={status} value={status}>
              {returnStatuses[status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Müşteriye Açıklama
        <textarea name="adminNote" maxLength={2000} required rows={3} />
      </label>
      <p className="muted">
        Durum değişikliği para iadesi veya stok hareketi oluşturmaz. Ödeme ve
        stok mutabakatı ayrıca yapılmalıdır.
      </p>
      <Feedback state={state} />
      <button className="button secondary" disabled={pending}>
        İade Talebini Güncelle
      </button>
    </form>
  );
}
export function NotificationRetry() {
  const [state, action, pending] = useActionState(retryNotifications, {});
  return (
    <form action={action}>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "İşleniyor…" : "Bekleyen Bildirimleri Yeniden Dene"}
      </button>
    </form>
  );
}
