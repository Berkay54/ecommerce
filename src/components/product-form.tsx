"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveProduct } from "@/app/admin/actions";
type Values = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  comparePrice: string;
  categoryId: string | null;
  active: boolean;
  featured: boolean;
  images: string;
  variants: { id: string; name: string; sku: string; stock: number }[];
};
export function ProductForm({
  product,
  categories,
}: {
  product?: Values;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    saveProduct.bind(null, product?.id ?? null),
    {},
  );
  const [draft, setDraft] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    images: product?.images ?? "",
    price: product?.price ?? "",
    comparePrice: product?.comparePrice ?? "",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });
  const field = (
    key:
      | "name"
      | "slug"
      | "description"
      | "categoryId"
      | "images"
      | "price"
      | "comparePrice",
  ) => ({
    value: draft[key],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setDraft({ ...draft, [key]: event.target.value }),
  });
  const [variants, setVariants] = useState(
    product?.variants.length
      ? product.variants
      : [{ id: "", name: "Default", sku: "", stock: 0 }],
  );
  return (
    <form action={action} className="editor">
      <div className="editor-main">
        <section className="panel">
          <p className="eyebrow">01 / The essentials</p>
          <h2>Product story</h2>
          <label>
            Name
            <input name="name" required maxLength={200} {...field("name")} />
          </label>
          <label>
            URL slug
            <input
              name="slug"
              maxLength={180}
              {...field("slug")}
              placeholder="Automatically generated from name"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={6}
              maxLength={20000}
              {...field("description")}
            />
          </label>
          <label>
            Category
            <select name="categoryId" {...field("categoryId")}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Link className="text-link" href="/admin/categories">
            Manage categories
          </Link>
        </section>
        <section className="panel">
          <p className="eyebrow">02 / Inventory</p>
          <h2>Variants & availability</h2>
          <p className="muted">
            Each variant has its own unique SKU and stock. Existing variant
            prices are preserved.
          </p>
          {variants.map((v, i) => (
            <fieldset className="variant" key={v.id || `new-${i}`}>
              <legend>Variant {i + 1}</legend>
              <input type="hidden" name="variantId" value={v.id} />
              <label>
                Name
                <input
                  name="variantName"
                  required
                  maxLength={100}
                  value={v.name}
                  onChange={(event) =>
                    setVariants(
                      variants.map((row, index) =>
                        index === i
                          ? { ...row, name: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </label>
              <label>
                SKU
                <input
                  name="sku"
                  required
                  maxLength={100}
                  value={v.sku}
                  onChange={(event) =>
                    setVariants(
                      variants.map((row, index) =>
                        index === i ? { ...row, sku: event.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  required
                  min="0"
                  max="2147483647"
                  step="1"
                  value={v.stock}
                  onChange={(event) =>
                    setVariants(
                      variants.map((row, index) =>
                        index === i
                          ? { ...row, stock: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                />
              </label>
              {!v.id && variants.length > 1 && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setVariants(variants.filter((_, index) => index !== i))
                  }
                >
                  Remove
                </button>
              )}
            </fieldset>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setVariants([
                ...variants,
                { id: "", name: "", sku: "", stock: 0 },
              ])
            }
            disabled={variants.length >= 100}
          >
            + Add variant
          </button>
        </section>
        <section className="panel">
          <p className="eyebrow">03 / Photography</p>
          <h2>Image URLs</h2>
          <label>
            One HTTP or HTTPS URL per line
            <textarea
              name="images"
              rows={5}
              maxLength={40000}
              {...field("images")}
              placeholder="https://example.com/image.jpg"
            />
          </label>
          <p className="muted">
            The first image is the cover. Up to 20 images.
          </p>
        </section>
      </div>
      <aside>
        <section className="panel">
          <p className="eyebrow">Publishing</p>
          <h2>Make it yours.</h2>
          <label>
            Price (USD)
            <input
              type="number"
              name="price"
              min="0"
              max="99999999.99"
              step="0.01"
              required
              {...field("price")}
            />
          </label>
          <label>
            Compare price (USD)
            <input
              type="number"
              name="comparePrice"
              min="0"
              max="99999999.99"
              step="0.01"
              {...field("comparePrice")}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="active"
              checked={draft.active}
              onChange={(event) =>
                setDraft({ ...draft, active: event.target.checked })
              }
            />
            Active on storefront
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="featured"
              checked={draft.featured}
              onChange={(event) =>
                setDraft({ ...draft, featured: event.target.checked })
              }
            />
            Featured on homepage
          </label>
          <div aria-live="polite">
            {state.error && <p className="notice error">{state.error}</p>}
          </div>
          <button className="button full" disabled={pending}>
            {pending ? "Saving..." : "Save product"}
          </button>
          <Link className="cancel" href="/admin/products">
            Cancel
          </Link>
        </section>
      </aside>
    </form>
  );
}
