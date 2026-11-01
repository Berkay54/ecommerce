"use client";
import { useActionState, useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { refreshPayment, canSettlePaymentCart } from "@/app/order-actions";

export function PaymentCartSettlement({
  id,
  succeeded,
}: {
  id: string;
  succeeded: boolean;
}) {
  const { ready, clear } = useCart();
  const applied = useRef(false);
  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    void (async () => {
      try {
        const raw = sessionStorage.getItem("form-field:checkout-request:v1");
        const saved: unknown = raw ? JSON.parse(raw) : null;
        if (
          !saved ||
          typeof saved !== "object" ||
          !("id" in saved) ||
          typeof saved.id !== "string"
        )
          return;
        if (!(await canSettlePaymentCart(id, saved.id))) return;
        const key = `form-field:paid-order:${id}`;
        if (succeeded && !localStorage.getItem(key)) {
          await clear();
          localStorage.setItem(key, "1");
        }
        sessionStorage.removeItem("form-field:checkout-request:v1");
      } catch {
        /* Storage/network failures preserve the bag; revisiting permits retry. */
      }
    })();
  }, [id, succeeded, ready, clear]);
  return null;
}
export function PaymentRefresh({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    refreshPayment.bind(null, id),
    {},
  );
  return (
    <form action={action}>
      <button className="button secondary" disabled={pending}>
        {pending ? "Kontrol ediliyor…" : "Ödeme Durumunu Kontrol Et"}
      </button>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
