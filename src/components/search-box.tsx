"use client";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { money } from "@/lib/catalog";

type Suggestions = {
  products: {
    id: string;
    name: string;
    slug: string;
    price: string;
    image: string | null;
  }[];
  categories: { id: string; name: string; slug: string }[];
};
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(-1);
  const [result, setResult] = useState<{
    query: string;
    data?: Suggestions;
    error?: boolean;
  } | null>(null);
  const id = useId();
  const router = useRouter();
  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search");
        const data: Suggestions = await response.json();
        setResult({ query: trimmed, data });
      } catch {
        if (!controller.signal.aborted)
          setResult({ query: trimmed, error: true });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);
  const current = result?.query === trimmed ? result : null;
  const options = [
    ...(current?.data?.categories ?? []).map((category) => ({
      ...category,
      href: `/products?category=${encodeURIComponent(category.slug)}`,
      kind: "Kategori",
      image: null,
      price: null,
    })),
    ...(current?.data?.products ?? []).map((product) => ({
      ...product,
      href: `/products/${encodeURIComponent(product.slug)}`,
      kind: "Ürün",
    })),
  ];
  const expanded = open && trimmed.length >= 2;
  return (
    <form
      action="/products"
      className="header-search search-suggest"
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Ürün, kategori veya marka ara
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Ürün, kategori veya marka ara"
        maxLength={150}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={`${id}-results`}
        aria-activedescendant={
          expanded && options[selection] ? `${id}-${selection}` : undefined
        }
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelection(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            setSelection(-1);
          }
          if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            options.length
          ) {
            event.preventDefault();
            setOpen(true);
            setSelection(
              (selection +
                (event.key === "ArrowDown" ? 1 : -1) +
                options.length) %
                options.length,
            );
          }
          if (event.key === "Enter" && expanded && options[selection]) {
            event.preventDefault();
            router.push(options[selection].href);
            setOpen(false);
          }
        }}
      />
      <button type="submit" aria-label="Ara">
        <Icon name="search" />
      </button>
      {expanded && (
        <div className="search-popover">
          {!current && <p role="status">Öneriler aranıyor…</p>}
          {current?.error && (
            <p role="status">
              Öneriler yüklenemedi. Arama düğmesiyle devam edebilirsiniz.
            </p>
          )}
          {current?.data && !options.length && (
            <p role="status">
              Öneri bulunamadı. Tüm sonuçlarda arayabilirsiniz.
            </p>
          )}
          <ul id={`${id}-results`} role="listbox" aria-label="Arama önerileri">
            {options.map((option, index) => (
              <li key={`${option.kind}-${option.id}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${id}-${index}`}
                  aria-selected={selection === index}
                  onClick={() => {
                    router.push(option.href);
                    setOpen(false);
                  }}
                >
                  {option.image ? (
                    <Image
                      src={option.image}
                      alt=""
                      width={44}
                      height={54}
                      unoptimized
                    />
                  ) : (
                    <Icon name="search" width={20} />
                  )}
                  <span>
                    <small>{option.kind}</small>
                    <strong>{option.name}</strong>
                  </span>
                  {option.price && <b>{money(option.price)}</b>}
                </button>
              </li>
            ))}
          </ul>
          <button type="submit" className="search-all">
            Tüm sonuçları gör →
          </button>
        </div>
      )}
    </form>
  );
}
