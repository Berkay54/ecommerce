"use client";
import { useId, useRef, useState } from "react";
import { cartMoney } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import { FavoriteButton } from "@/components/store-actions";
import { Icon } from "@/components/icons";
export function AddToCart({
  productId,
  variants,
  basePriceCents,
  comparePriceCents,
  productName,
}: {
  productId: string;
  basePriceCents: number;
  comparePriceCents: number | null;
  productName: string;
  variants: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    priceCents: number;
  }[];
}) {
  const cart = useCart();
  const formId = useId();
  const guide = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [adding, setAdding] = useState(false);
  const selected = variants.find((v) => v.id === variantId);
  const inBag =
    cart.lines.find(
      (line) => line.productId === productId && line.variantId === variantId,
    )?.quantity ?? 0;
  const remaining = Math.max(0, (selected?.stock ?? 0) - inBag);
  const available = variants.some((v) => v.stock > 0);
  const price = selected?.priceCents ?? basePriceCents;
  const discount =
    comparePriceCents && comparePriceCents > price
      ? Math.round((1 - price / comparePriceCents) * 100)
      : 0;
  return (
    <>
      <p className="product-sku">
        Ürün Kodu:{" "}
        {selected?.sku ??
          (variants.length === 1 ? variants[0].sku : "Varyant seçiniz")}
      </p>
      <div className="detail-price">
        <strong>{cartMoney(price)}</strong>
        {discount > 0 && comparePriceCents && (
          <>
            <del>{cartMoney(comparePriceCents)}</del>
            <span className="discount-badge">%{discount} İndirim</span>
          </>
        )}
      </div>
      <p className={`stock-state${available ? "" : " unavailable"}`}>
        {selected
          ? selected.stock > 0
            ? `Stokta · ${selected.stock} adet`
            : "Tükendi"
          : available
            ? "Stokta"
            : "Tükendi"}
      </p>
      <form
        ref={form}
        id={formId}
        className="purchase-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!selected || !remaining || adding) return;
          setAdding(true);
          setFeedback(
            await cart.add({ productId, variantId: selected.id, quantity }),
          );
          setAdding(false);
        }}
      >
        <label htmlFor="purchase-variant">Varyant Seçimi</label>
        <button
          type="button"
          className="text-link size-guide-trigger"
          onClick={() => guide.current?.showModal()}
        >
          Beden ve ölçü rehberi
        </button>
        <select
          id="purchase-variant"
          required
          value={variantId}
          disabled={!available || adding}
          onChange={(event) => {
            setVariantId(event.target.value);
            setQuantity(1);
            setFeedback(null);
          }}
        >
          <option value="">
            {available ? "Bir seçenek belirleyin" : "Tükendi"}
          </option>
          {variants.map((variant) => (
            <option
              key={variant.id}
              value={variant.id}
              disabled={variant.stock <= 0}
            >
              {variant.name} — {cartMoney(variant.priceCents)}
              {variant.stock <= 0 ? " / Tükendi" : ""}
            </option>
          ))}
        </select>
        {selected && inBag > 0 && (
          <p className="muted">Bu varyanttan sepetinizde {inBag} adet var.</p>
        )}
        {!variants.length && (
          <p className="muted">Bu ürün şu anda satışa uygun değil.</p>
        )}
        <div className="purchase-actions">
          <div className="quantity-control">
            <button
              type="button"
              aria-label="Adedi azalt"
              disabled={!selected || quantity <= 1 || adding}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <input
              aria-label="Adet"
              id="purchase-quantity"
              type="number"
              min={1}
              max={remaining || 1}
              required
              value={quantity}
              disabled={!selected || remaining <= 0 || adding}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <button
              type="button"
              aria-label="Adedi artır"
              disabled={!selected || quantity >= remaining || adding}
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
          <button
            className="button full"
            disabled={
              !cart.ready ||
              cart.busy ||
              adding ||
              !selected ||
              remaining <= 0 ||
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              quantity > remaining
            }
          >
            <Icon name="bag" width={20} />
            {adding
              ? "Ekleniyor…"
              : !available
                ? "Tükendi"
                : selected && !remaining
                  ? "Stoktaki ürünler sepetinizde"
                  : "Sepete Ekle"}
          </button>
        </div>
        <div aria-live="polite">
          {feedback && (
            <p className={`notice${feedback.ok ? "" : " error"}`}>
              {feedback.message}
              {feedback.ok && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => cart.setOpen(true)}
                  >
                    Sepeti Gör
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </form>
      <FavoriteButton productId={productId} full />
      <dialog
        ref={guide}
        className="size-guide-dialog panel"
        aria-labelledby={`${formId}-guide`}
        onClick={(event) => {
          if (event.target === event.currentTarget) guide.current?.close();
        }}
      >
        <div className="lightbox-toolbar">
          <h2 id={`${formId}-guide`}>Beden ve ölçü rehberi</h2>
          <button
            type="button"
            className="text-link"
            onClick={() => guide.current?.close()}
          >
            Kapat ✕
          </button>
        </div>
        <p>
          Bu üründe sunulan seçenekler:{" "}
          {variants.map((variant) => variant.name).join(", ") ||
            "Henüz seçenek eklenmedi"}
          .
        </p>
        <h3>Doğru ölçüyü nasıl bulurum?</h3>
        <p>
          Üzerinize iyi oturan bir giysiyi düz bir zemine serin. Göğüs, bel ve
          boy ölçülerini alın. Ayakkabı için ayak uzunluğunu topuktan en uzun
          parmağa kadar ölçün.
        </p>
        <p className="muted">
          Kalıplar ürüne göre değişebilir. Bu ürün için doğrulanmış santimetre
          tablosu henüz paylaşılmadı; ürün açıklamasındaki ölçüleri kontrol edin
          veya satın almadan önce destek alın.
        </p>
      </dialog>
      <div
        className="mobile-purchase-bar"
        role="region"
        aria-label="Hızlı satın alma"
      >
        <div>
          <span>{productName}</span>
          <strong>{cartMoney(price)}</strong>
          <small>{selected ? selected.name : "Önce varyant seçin"}</small>
        </div>
        <button
          type="button"
          className="button"
          disabled={
            !available ||
            adding ||
            cart.busy ||
            !cart.ready ||
            (!!selected && remaining <= 0)
          }
          onClick={() => {
            if (!selected) {
              form.current?.scrollIntoView({
                behavior: "instant",
                block: "center",
              });
              form.current?.querySelector("select")?.focus();
              return;
            }
            form.current?.requestSubmit();
          }}
        >
          {adding
            ? "Ekleniyor…"
            : !available
              ? "Tükendi"
              : selected
                ? "Sepete Ekle"
                : "Varyant Seç"}
        </button>
        {feedback && (
          <p role="status">
            {feedback.ok ? "Sepete eklendi." : feedback.message}
            {feedback.ok && (
              <button
                type="button"
                className="text-link"
                onClick={() => cart.setOpen(true)}
              >
                {" "}
                Sepeti Gör
              </button>
            )}
          </p>
        )}
      </div>
    </>
  );
}
