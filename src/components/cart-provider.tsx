"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  cartInputs,
  cartKey,
  parseCart,
  type CartInput,
  type CartLine,
  type CartResult,
} from "@/lib/cart";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  busy: boolean;
  notice: string;
  error: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: CartInput) => Promise<{ ok: boolean; message: string }>;
  update: (item: CartInput, quantity: number) => Promise<number | null>;
  remove: (item: CartInput) => void;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};
const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Cart components require CartProvider.");
  return value;
}
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const inputs = useRef<CartInput[]>([]);
  const currentLines = useRef<CartLine[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => undefined);
    return next;
  }, []);
  const persist = useCallback((items: CartInput[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartInputs(items)));
    } catch {
      setError(
        "Sepet tarayıcıya kaydedilemedi. Sayfayı kapattıktan sonra korumak için tarayıcı depolamasına izin verin.",
      );
    }
  }, []);
  const validate = useCallback(
    async (items: CartInput[]) => {
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items),
          cache: "no-store",
        });
        if (!response.ok) {
          const body: { error?: string } = await response.json();
          throw new Error(
            body.error ?? "Sepet güncellenemedi. Lütfen tekrar deneyin.",
          );
        }
        const result: CartResult = await response.json();
        inputs.current = cartInputs(result.lines);
        currentLines.current = result.lines;
        setLines(result.lines);
        setNotice([...new Set(result.messages)].join(" "));
        persist(inputs.current);
        return result;
      } catch (error) {
        const message =
          error instanceof Error && !(error instanceof TypeError)
            ? error.message
            : "Mağazaya bağlanılamadı. Kayıtlı sepetiniz korundu; lütfen tekrar deneyin.";
        setError(message);
        throw new Error(message);
      } finally {
        setBusy(false);
        setReady(true);
      }
    },
    [persist],
  );
  const refresh = useCallback(async () => {
    await enqueue(async () => {
      await validate(inputs.current);
    }).catch(() => undefined);
  }, [enqueue, validate]);
  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        try {
          inputs.current = raw ? parseCart(JSON.parse(raw)) : [];
        } catch {
          throw new Error(
            "Kayıtlı sepet okunamadı. Yeni bir seçim için sepeti temizleyin.",
          );
        }
        await validate(inputs.current);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Kayıtlı sepet okunamadı.",
        );
        setReady(true);
      }
    };
    void enqueue(load);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null)
        void enqueue(load);
    };
    const onFocus = () => {
      void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60000);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [enqueue, refresh, validate]);
  const add = async (item: CartInput) =>
    enqueue(async () => {
      const previous = inputs.current.find(
        (row) => cartKey(row) === cartKey(item),
      );
      const desired = item.quantity + (previous?.quantity ?? 0);
      try {
        const next = parseCart([
          ...inputs.current.filter((row) => cartKey(row) !== cartKey(item)),
          { ...item, quantity: desired },
        ]);
        const result = await validate(next);
        const line = result.lines.find((row) => cartKey(row) === cartKey(item));
        if (!line)
          return {
            ok: false,
            message: "Bu ürün seçeneği artık satışa uygun değil.",
          };
        if (line.quantity < desired)
          return {
            ok: false,
            message: `Stokta ${line.stock} adet var; sepetinizdeki miktar ${line.quantity} olarak güncellendi.`,
          };
        return { ok: true, message: "Ürün sepetinize eklendi." };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error ? error.message : "Ürün sepete eklenemedi.",
        };
      }
    });
  const update = async (item: CartInput, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
    return enqueue(async () => {
      const result = await validate(
        inputs.current.map((row) =>
          cartKey(row) === cartKey(item) ? { ...row, quantity } : row,
        ),
      );
      return (
        result.lines.find((row) => cartKey(row) === cartKey(item))?.quantity ??
        null
      );
    }).catch(() => null);
  };
  const remove = (item: CartInput) => {
    void enqueue(async () => {
      inputs.current = inputs.current.filter(
        (row) => cartKey(row) !== cartKey(item),
      );
      currentLines.current = currentLines.current.filter(
        (row) => cartKey(row) !== cartKey(item),
      );
      setLines(currentLines.current);
      setNotice("");
      setError("");
      persist(inputs.current);
    });
  };
  const clear = useCallback(() => {
    return enqueue(async () => {
      inputs.current = [];
      currentLines.current = [];
      setLines([]);
      setNotice("");
      setError("");
      persist([]);
    });
  }, [enqueue, persist]);
  return (
    <CartContext.Provider
      value={{
        lines,
        ready,
        busy,
        notice,
        error,
        open,
        setOpen,
        add,
        update,
        remove,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
