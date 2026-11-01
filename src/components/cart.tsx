"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cartKey, cartMoney, type CartLine } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/icons";
export function CartTrigger() {
  const cart = useCart();
  const count = cart.ready
    ? cart.lines.reduce((total, line) => total + line.quantity, 0)
    : 0;
  return (
    <button
      type="button"
      className="cart-trigger header-action"
      onClick={() => {
        cart.setOpen(true);
        void cart.refresh();
      }}
      aria-haspopup="dialog"
      aria-label={`Sepetim, ${count} ürün`}
    >
      <span className="cart-icon">
        <Icon name="bag" />
        <span className="cart-badge">{count}</span>
      </span>
      <span>Sepetim</span>
    </button>
  );
}
function Quantity({ line }: { line: CartLine }) {
  const cart = useCart();
  const [draft, setDraft] = useState(String(line.quantity));
  const commit = async () => {
    const next = Number(draft);
    if (!Number.isSafeInteger(next) || next < 1) {
      setDraft(String(line.quantity));
      return;
    }
    const clamped = Math.min(next, line.stock);
    if (clamped !== line.quantity) {
      const accepted = await cart.update(line, clamped);
      setDraft(String(accepted ?? line.quantity));
    } else setDraft(String(line.quantity));
  };
  return (
    <div className="quantity-control">
      <button
        type="button"
        disabled={cart.busy || line.quantity <= 1}
        aria-label={`${line.name} adedini azalt`}
        onClick={() => void cart.update(line, line.quantity - 1)}
      >
        −
      </button>
      <input
        aria-label={`${line.name}, ${line.variant} adedi`}
        type="number"
        min={1}
        max={line.stock}
        step={1}
        value={draft}
        disabled={cart.busy}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <button
        type="button"
        disabled={cart.busy || line.quantity >= line.stock}
        aria-label={`${line.name} adedini artır`}
        onClick={() => void cart.update(line, line.quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
export function CartContents({ drawer = false }: { drawer?: boolean }) {
  const cart = useCart();
  const subtotal = cart.lines.reduce(
    (total, line) => total + line.unitPriceCents * line.quantity,
    0,
  );
  const freeShipping = subtotal >= 75000;
  return (
    <div
      className={`cart-contents${drawer ? " in-drawer" : ""}`}
      aria-busy={cart.busy}
    >
      {cart.error && (
        <div className="notice error" role="alert">
          <p>{cart.error}</p>
          <button
            type="button"
            className="text-link"
            disabled={cart.busy}
            onClick={() => void cart.refresh()}
          >
            Tekrar Dene
          </button>
          {!cart.lines.length && (
            <button type="button" className="text-link" onClick={cart.clear}>
              Kayıtlı Sepeti Temizle
            </button>
          )}
        </div>
      )}
      {cart.notice && (
        <p className="notice" role="status">
          {cart.notice}
        </p>
      )}
      {!cart.ready ? (
        <p role="status" className="muted">
          Sepetiniz yükleniyor…
        </p>
      ) : !cart.lines.length ? (
        <div className="empty cart-empty">
          <div className="empty-icon">
            <Icon name="bag" width={38} height={38} />
          </div>
          <h2>Sepetiniz henüz boş</h2>
          <p>Alışverişe başlayarak ürünleri sepetinize ekleyebilirsiniz.</p>
          <Link
            href="/products"
            className="button"
            onClick={() => cart.setOpen(false)}
          >
            Ürünleri Keşfet
            <Icon name="arrow" width={18} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-list-heading">
              <h2>
                Ürünleriniz{" "}
                <span>
                  (
                  {cart.lines.reduce((total, line) => total + line.quantity, 0)}
                  )
                </span>
              </h2>
              <button
                type="button"
                className="text-link"
                disabled={cart.busy}
                onClick={cart.clear}
              >
                Sepeti Temizle
              </button>
            </div>
            <ul className="cart-lines">
              {cart.lines.map((line) => (
                <li className="cart-line" key={cartKey(line)}>
                  <Link
                    className="cart-image"
                    href={`/products/${line.slug}`}
                    onClick={() => cart.setOpen(false)}
                  >
                    {line.image ? (
                      <Image
                        src={line.image.url}
                        alt={line.image.alt}
                        fill
                        unoptimized
                        sizes="112px"
                      />
                    ) : (
                      <span className="no-image">Görsel yok</span>
                    )}
                  </Link>
                  <div className="cart-item-copy">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={() => cart.setOpen(false)}
                    >
                      <h3>{line.name}</h3>
                    </Link>
                    <p className="muted">{line.variant}</p>
                    <p className="cart-unit">
                      Birim fiyat: {cartMoney(line.unitPriceCents)}
                    </p>
                    <Quantity
                      key={`${cartKey(line)}:${line.quantity}`}
                      line={line}
                    />
                    <p className="muted cart-stock">Stokta {line.stock} adet</p>
                    <button
                      type="button"
                      className="text-link"
                      disabled={cart.busy}
                      onClick={() => cart.remove(line)}
                      aria-label={`${line.name}, ${line.variant} ürününü sil`}
                    >
                      Sil
                    </button>
                  </div>
                  <p className="cart-line-total">
                    {cartMoney(line.unitPriceCents * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href="/products"
              className="text-link cart-continue"
              onClick={() => cart.setOpen(false)}
            >
              Alışverişe Devam Et
              <Icon name="arrow" width={16} />
            </Link>
          </div>
          <aside className="cart-summary">
            <h2>{drawer ? "Sepet Özeti" : "Sipariş Özeti"}</h2>
            <dl>
              <div>
                <dt>Ara Toplam</dt>
                <dd>{cartMoney(subtotal)}</dd>
              </div>
              <div>
                <dt>Kargo</dt>
                <dd className={freeShipping ? "shipping-free" : ""}>
                  {freeShipping ? "Ücretsiz" : "Henüz hesaplanmıyor"}
                </dd>
              </div>
              {!drawer && (
                <div>
                  <dt>İndirim</dt>
                  <dd>{cartMoney(0)}</dd>
                </div>
              )}
              <div className="summary-total">
                <dt>Toplam</dt>
                <dd>{cartMoney(subtotal)}</dd>
              </div>
            </dl>
            {!freeShipping && (
              <p className="muted">
                Kargo ücreti toplam tutara dahil değildir. Ücretsiz kargo için{" "}
                {cartMoney(75000 - subtotal)} daha ürün ekleyebilirsiniz.
              </p>
            )}
            {!drawer && (
              <div className="coupon">
                <label htmlFor="coupon-code">İndirim Kodu</label>
                <div>
                  <input
                    id="coupon-code"
                    placeholder="İndirim kodunuz"
                    disabled
                  />
                  <button className="button secondary" type="button" disabled>
                    Uygula
                  </button>
                </div>
                <small>Kupon kullanımı henüz aktif değil.</small>
              </div>
            )}
            {drawer ? (
              <Link
                href="/cart"
                className="button full"
                onClick={() => cart.setOpen(false)}
              >
                Sepete Git
                <Icon name="arrow" width={18} />
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="button full"
                onClick={() => cart.setOpen(false)}
              >
                Siparişi Tamamla
              </Link>
            )}
            <p className="cart-disclaimer">
              <Icon name="shield" width={16} />
              Sepetiniz bu tarayıcıda saklanır.
            </p>
            <p className="muted">
              Fiyatlar ve stok güncel olarak kontrol edilir. Sepetteki ürünler
              rezerve edilmez.
            </p>
            {drawer && (
              <Link
                href="/products"
                className="text-link cart-continue"
                onClick={() => cart.setOpen(false)}
              >
                Alışverişe Devam Et
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
export function CartDrawer() {
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (cart.open && !element.open) element.showModal();
    if (!cart.open && element.open) element.close();
    if (!cart.open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cart.open]);
  return (
    <dialog
      className="cart-drawer"
      ref={dialog}
      aria-labelledby="bag-title"
      onClose={() => cart.setOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            cart.setOpen(false);
        }
      }}
    >
      <div className="drawer-heading">
        <div>
          <h2 id="bag-title">Sepetim</h2>
          <p>
            {cart.lines.reduce((total, line) => total + line.quantity, 0)} ürün
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Sepeti kapat"
          onClick={() => cart.setOpen(false)}
          autoFocus
        >
          <Icon name="close" />
        </button>
      </div>
      {cart.open && <CartContents drawer />}
    </dialog>
  );
}
