"use client";
import { useActionState } from "react";
import { submitReview, moderateReview } from "@/app/review-actions";
export function ReviewForm({
  productId,
  rating,
  comment,
}: {
  productId: string;
  rating?: number;
  comment?: string | null;
}) {
  const [state, action, pending] = useActionState(
    submitReview.bind(null, productId),
    {},
  );
  return (
    <form action={action} className="panel review-form">
      <h3>{rating ? "Yorumunuzu düzenleyin" : "Deneyiminizi paylaşın"}</h3>
      <p className="muted">
        Yorumunuz onaylandıktan sonra yayımlanır. Düzenlenen yorumlar yeniden
        onaya gönderilir.
      </p>
      <label>
        Puan
        <select name="rating" required defaultValue={rating ?? ""}>
          <option value="" disabled>
            Puan seçin
          </option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </label>
      <label>
        Yorumunuz
        <textarea
          name="comment"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          defaultValue={comment ?? ""}
        />
      </label>
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
      <button className="button" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Yorumu Gönder"}
      </button>
    </form>
  );
}
export function ReviewModeration({
  id,
  approved,
  rating,
  comment,
}: {
  id: string;
  approved: boolean;
  rating: number;
  comment: string | null;
}) {
  const [state, action, pending] = useActionState(
    moderateReview.bind(null, id, rating, comment),
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="approved" value={String(!approved)} />
      <button className="button secondary" disabled={pending}>
        {approved ? "Yayından Kaldır" : "Onayla ve Yayımla"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
