"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { CartTrigger } from "@/components/cart";
const key = "form-field:favorites:v1";
const empty = () => "[]";
function snapshot() {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("favorites-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("favorites-change", callback);
  };
}
function useFavorites() {
  const raw = useSyncExternalStore(subscribe, snapshot, empty);
  let ids: string[] = [];
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value))
      ids = value
        .filter(
          (id): id is string => typeof id === "string" && id.length <= 100,
        )
        .slice(0, 100);
  } catch {
    /* Invalid saved favorites are treated as empty. */
  }
  return ids;
}
export function FavoriteButton({
  productId,
  full = false,
}: {
  productId: string;
  full?: boolean;
}) {
  const ids = useFavorites();
  const saved = ids.includes(productId);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className={full ? "button secondary favorite-full" : "favorite-button"}
        aria-label={saved ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        aria-pressed={saved}
        onClick={() => {
          try {
            localStorage.setItem(
              key,
              JSON.stringify(
                saved
                  ? ids.filter((id) => id !== productId)
                  : [...ids.slice(-99), productId],
              ),
            );
            window.dispatchEvent(new Event("favorites-change"));
            setError("");
          } catch {
            setError(
              "Favorileri kaydetmek için tarayıcı depolamasına izin verin.",
            );
          }
        }}
      >
        <Icon name="heart" fill={saved ? "currentColor" : "none"} />
        {full && (saved ? "Favorilerime Eklendi" : "Favorilere Ekle")}
      </button>
      {error && (
        <span className="favorite-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
export function HeaderActions({ account }: { account: React.ReactNode }) {
  const ids = useFavorites();
  return (
    <div className="header-actions">
      {account}
      <Link
        href={`/products?favorites=${encodeURIComponent(ids.join(",") || "empty")}`}
        className="header-action"
        aria-label="Favorilerim"
      >
        <Icon name="heart" />
        <span>Favorilerim</span>
      </Link>
      <CartTrigger />
    </div>
  );
}
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ids = useFavorites();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="icon-button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobil menü"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a"))
              setOpen(false);
          }}
        >
          {children}
          <Link
            href={`/products?favorites=${encodeURIComponent(ids.join(",") || "empty")}`}
          >
            Favorilerim
          </Link>
        </nav>
      )}
    </div>
  );
}
