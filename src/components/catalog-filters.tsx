"use client";
import Link from "next/link";
import { useRef } from "react";
import { Icon } from "@/components/icons";
export type FilterValues = {
  category: string;
  min: string;
  max: string;
  stock: string;
  q: string;
  sort: string;
  campaign: string;
  featured: string;
  favorites: string;
};
type Props = {
  categories: { id: string; name: string; slug: string }[];
  values: FilterValues;
};
export function FilterFields({ categories, values }: Props) {
  return (
    <form action="/products" className="catalog-filter-form">
      {(["q", "sort", "campaign", "featured", "favorites"] as const).map(
        (key) =>
          values[key] && (
            <input key={key} type="hidden" name={key} value={values[key]} />
          ),
      )}
      <fieldset>
        <legend>Kategoriler</legend>
        <label className="filter-check">
          <input
            type="radio"
            name="category"
            value=""
            defaultChecked={!values.category}
          />
          Tüm Kategoriler
        </label>
        {categories.map((category) => (
          <label className="filter-check" key={category.id}>
            <input
              type="radio"
              name="category"
              value={category.slug}
              defaultChecked={values.category === category.slug}
            />
            {category.name}
          </label>
        ))}
        {!categories.length && (
          <p className="muted">Henüz kategori eklenmedi.</p>
        )}
      </fieldset>
      <fieldset>
        <legend>Fiyat Aralığı</legend>
        <div className="price-filter">
          <label>
            En az (TL)
            <input
              type="number"
              name="min"
              min="0"
              max="99999999.99"
              step="0.01"
              defaultValue={values.min}
              placeholder="0"
            />
          </label>
          <label>
            En çok (TL)
            <input
              type="number"
              name="max"
              min="0"
              max="99999999.99"
              step="0.01"
              defaultValue={values.max}
              placeholder="Üst sınır"
            />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Stok Durumu</legend>
        <label className="filter-check">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={values.stock === "1"}
          />
          Yalnızca stoktakiler
        </label>
      </fieldset>
      <button className="button full" type="submit">
        Filtreleri Uygula
      </button>
      <Link className="cancel" href="/products">
        Filtreleri Temizle
      </Link>
    </form>
  );
}
export function CatalogFilters(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <aside className="catalog-sidebar">
        <h2>Filtreler</h2>
        <FilterFields {...props} />
      </aside>
      <button
        type="button"
        className="button secondary mobile-filter-trigger"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="filter" width={18} />
        Filtrele
      </button>
      <dialog
        className="filter-drawer"
        ref={dialog}
        aria-labelledby="filter-title"
      >
        <div className="drawer-heading">
          <h2 id="filter-title">Filtreler</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Filtreleri kapat"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <FilterFields {...props} />
      </dialog>
    </>
  );
}
export function CatalogSort({ values }: { values: FilterValues }) {
  return (
    <form action="/products" className="sort-form">
      {(Object.keys(values) as (keyof FilterValues)[])
        .filter((key) => key !== "sort")
        .map(
          (key) =>
            values[key] && (
              <input key={key} type="hidden" name={key} value={values[key]} />
            ),
        )}
      <label htmlFor="catalog-sort">Sırala</label>
      <select
        name="sort"
        id="catalog-sort"
        defaultValue={values.sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="recommended">Önerilen</option>
        <option value="newest">En Yeniler</option>
        <option value="price-asc">Fiyat: Artan</option>
        <option value="price-desc">Fiyat: Azalan</option>
        <option value="popular">Çok Satanlar</option>
      </select>
      <noscript>
        <button className="button">Uygula</button>
      </noscript>
    </form>
  );
}
