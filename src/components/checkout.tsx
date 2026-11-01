"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { cartInputs, cartMoney } from "@/lib/cart";
import { placeOrder } from "@/app/order-actions";
import type { AddressValue } from "@/lib/order-display";
const requestStorageKey = "form-field:checkout-request:v1";
export function Checkout({
  addresses,
  paymentAvailable,
}: {
  addresses: AddressValue[];
  paymentAvailable: boolean;
}) {
  const cart = useCart();
  const [state, action, pending] = useActionState(placeOrder, {});
  const [requestId, setRequestId] = useState("");
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const serialized = JSON.stringify(cartInputs(cart.lines));
  const requestCart = `${addressId}:${serialized}`;
  useEffect(() => {
    if (!cart.ready) return;
    void Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(requestStorageKey);
        const saved: unknown = raw ? JSON.parse(raw) : null;
        if (
          typeof saved === "object" &&
          saved !== null &&
          "cart" in saved &&
          saved.cart === requestCart &&
          "id" in saved &&
          typeof saved.id === "string" &&
          /^[0-9a-f-]{36}$/i.test(saved.id)
        ) {
          setRequestId(saved.id);
          return;
        }
      } catch {
        /* A fresh request key still prevents repeated submissions in this tab. */
      }
      const id = crypto.randomUUID();
      setRequestId(id);
      try {
        sessionStorage.setItem(
          requestStorageKey,
          JSON.stringify({ id, cart: requestCart }),
        );
      } catch {
        /* Storage may be disabled; the in-memory key remains stable. */
      }
    });
  }, [cart.ready, requestCart]);
  useEffect(() => {
    if (state.redirectUrl) window.location.assign(state.redirectUrl);
  }, [state.redirectUrl]);
  if (state.redirectUrl)
    return (
      <div className="notice" role="status">
        Ödeme sayfasına yönlendiriliyorsunuz…
        <a href={state.redirectUrl} className="text-link">
          Devam Et
        </a>
      </div>
    );
  if (!cart.ready) return <p role="status">Sepetiniz kontrol ediliyor…</p>;
  if (!cart.lines.length)
    return (
      <div className="empty">
        <h2>Sepetiniz henüz boş</h2>
        <Link href="/products" className="button">
          Ürünleri Keşfet
        </Link>
      </div>
    );
  const total = cart.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  return (
    <form action={action} className="checkout-layout">
      <input type="hidden" name="cart" value={serialized} />
      <input type="hidden" name="requestId" value={requestId} />
      <div className="checkout-sections">
        <section className="panel">
          <h2>1. Teslimat Adresi</h2>
          {addresses.map((address) => (
            <label className="checkout-address" key={address.id}>
              <input
                type="radio"
                name="addressId"
                value={address.id}
                checked={addressId === address.id}
                onChange={() => setAddressId(address.id)}
                required
              />
              <span>
                <strong>
                  {address.title || "Adres"} · {address.fullName}
                </strong>
                <span>
                  {address.addressLine}
                  <br />
                  {address.district} / {address.city} {address.postalCode}
                  <br />
                  {address.phone}
                </span>
              </span>
            </label>
          ))}
          {!addresses.length && (
            <p className="notice">
              Sipariş için önce bir teslimat adresi ekleyin.
            </p>
          )}
          <Link href="/hesabim/adresler?next=/checkout" className="text-link">
            Adres Ekle / Düzenle
          </Link>
        </section>
        <section className="panel">
          <h2>2. Sipariş Özeti</h2>
          {cart.lines.map((line) => (
            <div
              className="checkout-item"
              key={`${line.productId}:${line.variantId}`}
            >
              <div>
                <strong>{line.name}</strong>
                <p>
                  {line.variant} · {line.quantity} adet
                  <br />
                  Birim fiyat: {cartMoney(line.unitPriceCents)}
                </p>
              </div>
              <strong>{cartMoney(line.unitPriceCents * line.quantity)}</strong>
            </div>
          ))}
          <Link href="/cart" className="text-link">
            Sepeti Düzenle
          </Link>
        </section>
        <section className="panel">
          <h2>3. Ödeme</h2>
          {!paymentAvailable && (
            <p className="notice error" role="alert">
              Sandbox ödeme ayarları henüz tamamlanmadı. Mağaza yöneticisi
              iyzico sandbox anahtarlarını ve uygulama adresini tanımlamalıdır.
            </p>
          )}
          <p>Güvenli ödeme iyzico altyapısı ile gerçekleştirilmektedir.</p>
          <p className="notice">
            Sandbox test ortamındasınız. Gerçek ödeme alınmaz.
          </p>
          <label>
            T.C. Kimlik Numarası
            <input
              name="identityNumber"
              inputMode="numeric"
              pattern="[1-9][0-9]{10}"
              minLength={11}
              maxLength={11}
              autoComplete="off"
              required
              aria-describedby="identity-description"
            />
          </label>
          <p className="muted" id="identity-description">
            iyzico tarafından istenir; yalnızca ödeme isteğinde iletilir ve
            mağaza veritabanına kaydedilmez. Fatura bilgileri seçtiğiniz
            teslimat adresiyle aynıdır.
          </p>
          <p className="muted">
            Kart bilgilerinizi iyzico&apos;nun sandbox sayfasında girersiniz. Stok,
            ödeme doğrulandıktan sonra düşer; ödeme sırasında stok değişirse
            işlem incelemeye alınabilir.
          </p>
        </section>
      </div>
      <aside className="panel checkout-summary">
        <h2>Sipariş Toplamı</h2>
        <p className="checkout-total">{cartMoney(total)}</p>
        <p className="muted">
          Toplam yalnızca ürün bedelidir. Kargo ücreti bu aşamada hesaplanmaz
          veya tahsil edilmez. Fiyat ve stok sipariş oluşturulurken sunucuda
          yeniden kontrol edilir.
        </p>
        {cart.error && (
          <p className="notice error" role="alert">
            {cart.error}
          </p>
        )}
        {cart.notice && (
          <p className="notice" role="status">
            {cart.notice}
          </p>
        )}
        {state.error && (
          <p className="notice error" role="alert">
            {state.error}
          </p>
        )}
        <button
          className="button full"
          disabled={
            pending ||
            cart.busy ||
            !!cart.error ||
            !requestId ||
            !addressId ||
            !paymentAvailable
          }
        >
          {pending ? "Ödeme hazırlanıyor…" : "Ödemeye Geç"}
        </button>
        <p className="muted">
          Siparişiniz PENDING olarak kaydedilir. Ödeme öncesinde stok ayrılmaz.
        </p>
      </aside>
    </form>
  );
}
