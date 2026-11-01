"use client";
import { useActionState } from "react";
import type { OrderStatus } from "@prisma/client";
import { changeOrderStatus } from "@/app/order-actions";
import { orderStatuses, statusTransitions } from "@/lib/order-display";
export function OrderStatusForm({
  id,
  status,
  sandboxPayment = false,
  paymentSucceeded = false,
}: {
  id: string;
  status: OrderStatus;
  sandboxPayment?: boolean;
  paymentSucceeded?: boolean;
}) {
  const [state, action, pending] = useActionState(
    changeOrderStatus.bind(null, id),
    {},
  );
  const choices = sandboxPayment
    ? paymentSucceeded
      ? statusTransitions[status].filter(
          (value) => value !== "CANCELLED" && value !== "PAID",
        )
      : []
    : statusTransitions[status].filter((value) => value !== "PAID");
  return (
    <form action={action} className="panel order-status-form">
      <h2>Sipariş Durumu</h2>
      <label>
        Yeni Durum
        <select
          name="status"
          defaultValue={status}
          disabled={pending || !choices.length}
        >
          {[status, ...choices].map((value) => (
            <option value={value} key={value}>
              {orderStatuses[value]}
            </option>
          ))}
        </select>
      </label>
      <p className="muted">
        {sandboxPayment
          ? "Sandbox ödeme onayı yalnızca doğrulanmış iyzico sonucu ile verilir. İptal ve iade entegrasyonu bu aşamada desteklenmiyor."
          : "Eski siparişlerde durum yönetimi manueldir. İptal edilen siparişin düşülmüş stokları bir kez geri eklenir."}
      </p>
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
      <button className="button" disabled={pending || !choices.length}>
        {pending ? "Güncelleniyor…" : "Durumu Güncelle"}
      </button>
    </form>
  );
}
