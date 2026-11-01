"use client";
import { useActionState, useState } from "react";
import { createCategory, deleteProduct } from "@/app/admin/actions";
export function DeleteProduct({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState(
    deleteProduct.bind(null, id),
    {},
  );
  return (
    <div>
      {!confirm ? (
        <button className="text-link danger" onClick={() => setConfirm(true)}>
          Ürünü Sil
        </button>
      ) : (
        <form action={action}>
          <p>Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?</p>
          <button className="button danger" disabled={pending}>
            {pending ? "Siliniyor…" : "Silmeyi Onayla"}
          </button>{" "}
          <button
            className="button secondary"
            type="button"
            onClick={() => setConfirm(false)}
          >
            İptal
          </button>
        </form>
      )}
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
    </div>
  );
}
export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, {});
  return (
    <form action={action} className="panel">
      <h2>Kategori Oluştur</h2>
      <label>
        Ad
        <input name="name" required maxLength={100} />
      </label>
      <label>
        URL kısa adı (isteğe bağlı)
        <input name="slug" maxLength={180} />
      </label>
      <p aria-live="polite" className={state.error ? "notice error" : "muted"}>
        {state.error || state.success}
      </p>
      <button className="button" disabled={pending}>
        {pending ? "Oluşturuluyor…" : "Kategori Oluştur"}
      </button>
    </form>
  );
}
