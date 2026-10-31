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
          Delete product
        </button>
      ) : (
        <form action={action}>
          <p>Delete this product permanently?</p>
          <button className="button danger" disabled={pending}>
            {pending ? "Deleting..." : "Confirm delete"}
          </button>{" "}
          <button
            className="button secondary"
            type="button"
            onClick={() => setConfirm(false)}
          >
            Cancel
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
      <h2>Create category</h2>
      <label>
        Name
        <input name="name" required maxLength={100} />
      </label>
      <label>
        Slug (optional)
        <input name="slug" maxLength={180} />
      </label>
      <p aria-live="polite" className={state.error ? "notice error" : "muted"}>
        {state.error || state.success}
      </p>
      <button className="button" disabled={pending}>
        {pending ? "Creating..." : "Create category"}
      </button>
    </form>
  );
}
