"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveProduct } from "@/app/admin/actions";
import { ProductImages } from "@/components/product-images";
import type { ProductImageValue } from "@/lib/images";
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
  images: ProductImageValue[];
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
  const [imagesBlocked, setImagesBlocked] = useState(false);
  const [draft, setDraft] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    price: product?.price ?? "",
    comparePrice: product?.comparePrice ?? "",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });
  const field = (
    key:
      "name" | "slug" | "description" | "categoryId" | "price" | "comparePrice",
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
      : [{ id: "", name: "Standart", sku: "", stock: 0 }],
  );
  return (
    <form
      action={action}
      className="editor"
      onSubmit={(event) => {
        if (imagesBlocked || pending) event.preventDefault();
      }}
    >
      <div className="editor-main">
        <section className="panel">
          <p className="eyebrow">Ürün Bilgileri</p>
          <h2>Temel Bilgiler</h2>
          <label>
            Ad
            <input name="name" required maxLength={200} {...field("name")} />
          </label>
          <label>
            URL kısa adı
            <input
              name="slug"
              maxLength={180}
              {...field("slug")}
              placeholder="Boş bırakırsanız ürün adından oluşturulur"
            />
          </label>
          <label>
            Açıklama
            <textarea
              name="description"
              rows={6}
              maxLength={20000}
              {...field("description")}
            />
          </label>
          <label>
            Kategori
            <select name="categoryId" {...field("categoryId")}>
              <option value="">Kategorisiz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Link className="text-link" href="/admin/categories">
            Kategorileri Yönet
          </Link>
        </section>
        <section className="panel">
          <p className="eyebrow">Stok Yönetimi</p>
          <h2>Varyantlar ve Stok</h2>
          <p className="muted">
            Her varyantın ayrı stok kodu ve stok miktarı vardır. Mevcut varyant
            fiyatları korunur.
          </p>
          {variants.map((v, i) => (
            <fieldset className="variant" key={v.id || `new-${i}`}>
              <legend>Varyant {i + 1}</legend>
              <input type="hidden" name="variantId" value={v.id} />
              <label>
                Ad
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
                SKU / Stok Kodu
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
                Stok
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
                  Kaldır
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
            + Varyant Ekle
          </button>
        </section>
        <ProductImages
          initialImages={product?.images ?? []}
          disabled={pending}
          onBlockedChange={setImagesBlocked}
        />
      </div>
      <aside>
        <section className="panel">
          <p className="eyebrow">Yayın Ayarları</p>
          <h2>Fiyat ve Yayın Durumu</h2>
          <label>
            Fiyat (TL)
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
            Eski Fiyat (TL)
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
            Mağazada aktif
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
            Ana sayfada öne çıkar
          </label>
          <div aria-live="polite">
            {state.error && <p className="notice error">{state.error}</p>}
          </div>
          {imagesBlocked && (
            <p className="muted" role="status">
              Kaydetmeden önce seçtiğiniz görselleri yükleyin veya kaldırın.
            </p>
          )}
          <button className="button full" disabled={pending || imagesBlocked}>
            {pending ? "Kaydediliyor…" : "Ürünü Kaydet"}
          </button>
          <Link className="cancel" href="/admin/products">
            İptal
          </Link>
        </section>
      </aside>
    </form>
  );
}
