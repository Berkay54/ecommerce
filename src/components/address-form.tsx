"use client";
import { useActionState } from "react";
import { saveAddress, deleteAddress } from "@/app/account-actions";
import type { AddressValue } from "@/lib/order-display";
export function AddressForm({ address }: { address?: AddressValue }) {
  const [state, action, pending] = useActionState(
    saveAddress.bind(null, address?.id ?? null),
    {},
  );
  return (
    <form action={action} className="address-form">
      <label>
        Adres Başlığı
        <input
          name="title"
          defaultValue={address?.title ?? ""}
          maxLength={60}
          required
          placeholder="Ev, iş…"
        />
      </label>
      <label>
        Ad Soyad
        <input
          name="fullName"
          defaultValue={address?.fullName ?? ""}
          autoComplete="shipping name"
          maxLength={120}
          required
        />
      </label>
      <label>
        Telefon
        <input
          name="phone"
          type="tel"
          defaultValue={address?.phone ?? ""}
          autoComplete="shipping tel"
          maxLength={25}
          required
          placeholder="05321234567"
        />
      </label>
      <div className="form-two-columns">
        <label>
          İl
          <input
            name="city"
            defaultValue={address?.city ?? ""}
            autoComplete="shipping address-level1"
            maxLength={80}
            required
          />
        </label>
        <label>
          İlçe
          <input
            name="district"
            defaultValue={address?.district ?? ""}
            autoComplete="shipping address-level2"
            maxLength={80}
            required
          />
        </label>
      </div>
      <label>
        Açık Adres
        <textarea
          name="addressLine"
          defaultValue={address?.addressLine ?? ""}
          autoComplete="shipping street-address"
          maxLength={1000}
          rows={3}
          required
        />
      </label>
      <label>
        Posta Kodu
        <input
          name="postalCode"
          defaultValue={address?.postalCode ?? ""}
          autoComplete="shipping postal-code"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="İsteğe bağlı"
        />
      </label>
      <div aria-live="polite">
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
      </div>
      <button className="button" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Adresi Kaydet"}
      </button>
    </form>
  );
}
export function DeleteAddress({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteAddress.bind(null, id),
    {},
  );
  return (
    <form action={action}>
      <button className="text-link danger" disabled={pending}>
        {pending ? "Siliniyor…" : "Adresi Sil"}
      </button>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
