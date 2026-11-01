"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
  imageFileError,
  type ProductImageValue,
} from "@/lib/images";

type ImageDraft = ProductImageValue & {
  key: string;
  preview: string;
  file?: File;
  uploadedNow?: boolean;
  error?: string;
};
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
export function ProductImages({
  initialImages,
  disabled,
  onBlockedChange,
}: {
  initialImages: ProductImageValue[];
  disabled: boolean;
  onBlockedChange: (blocked: boolean) => void;
}) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    hydratedSnapshot,
    serverSnapshot,
  );
  const [items, setItems] = useState<ImageDraft[]>(() =>
    initialImages.map((image, i) => ({
      ...image,
      key: `saved-${i}`,
      preview: image.url,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [legacyUrl, setLegacyUrl] = useState("");
  const previews = useRef<string[]>([]);
  useEffect(
    () => () => {
      previews.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  function replace(next: ImageDraft[], working = false) {
    setItems(next);
    onBlockedChange(working || next.some((image) => image.file));
  }
  function choose(files: FileList | null) {
    if (!files) return;
    const next = [...items];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PRODUCT_IMAGES) {
        errors.push("En fazla 20 görsel ekleyin.");
        break;
      }
      const error = imageFileError(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      next.push({ key: crypto.randomUUID(), url: "", alt: "", preview, file });
    }
    replace(next);
    setMessage(errors.join(" "));
  }
  async function uploadSelected() {
    setBusy(true);
    onBlockedChange(true);
    setMessage("");
    let next = [...items];
    for (const item of next.filter((image) => image.file)) {
      try {
        const data = new FormData();
        data.set("file", item.file!);
        const response = await fetch("/api/admin/images", {
          method: "POST",
          body: data,
        });
        const result: { url?: string; error?: string } = await response.json();
        if (!response.ok || !result.url)
          throw new Error(
            result.error ?? "Upload failed. Lütfen tekrar deneyin.",
          );
        next = next.map((image) =>
          image.key === item.key
            ? {
                ...image,
                url: result.url!,
                preview: result.url!,
                file: undefined,
                uploadedNow: true,
                error: undefined,
              }
            : image,
        );
        URL.revokeObjectURL(item.preview);
      } catch (error) {
        next = next.map((image) =>
          image.key === item.key
            ? {
                ...image,
                error:
                  error instanceof Error
                    ? error.message
                    : "Upload failed. Lütfen tekrar deneyin.",
              }
            : image,
        );
      }
      setItems(next);
    }
    setBusy(false);
    replace(next);
  }
  async function remove(item: ImageDraft) {
    setMessage("");
    if (item.uploadedNow) {
      setBusy(true);
      onBlockedChange(true);
      try {
        const response = await fetch("/api/admin/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        if (!response.ok) {
          const result: { error?: string } = await response.json();
          throw new Error(
            result.error ?? "Görsel silinemedi. Lütfen tekrar deneyin.",
          );
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Görsel silinemedi. Lütfen tekrar deneyin.",
        );
        setBusy(false);
        onBlockedChange(items.some((image) => Boolean(image.file)));
        return;
      }
      setBusy(false);
    }
    if (item.file) URL.revokeObjectURL(item.preview);
    replace(items.filter((image) => image.key !== item.key));
  }
  function move(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    replace(next);
  }
  return (
    <section className="panel image-editor">
      <p className="eyebrow">Ürün Görselleri</p>
      <h2>Görseller</h2>
      <p className="muted">
        İlk görsel ana ürün görselidir. En fazla 20 JPEG, PNG veya WebP görsel
        ekleyebilirsiniz; her biri en fazla 3 MB olmalıdır. Galeri
        değişiklikleri kaydettiğinizde yayımlanır.
      </p>
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(
          items
            .filter((image) => image.url)
            .map(({ url, alt }) => ({ url, alt })),
        )}
      />
      <fieldset
        disabled={!hydrated || disabled || busy}
        className="image-editor-controls"
      >
        <label className="file-picker">
          <span className="button secondary file-picker-button">
            Görsel Seç
          </span>
          <span className="muted">Birden fazla dosya seçebilirsiniz.</span>
          <input
            className="sr-only"
            aria-label="Görsel Seç"
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            disabled={items.length >= MAX_PRODUCT_IMAGES}
            onChange={(event) => {
              choose(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {items.some((image) => image.file) && (
          <>
            <p className="muted">
              Önizleme hazır. Ürünü kaydetmeden önce seçilen görselleri yükleyin
              veya kaldırın.
            </p>
            <button
              className="button secondary"
              type="button"
              onClick={() => void uploadSelected()}
            >
              Seçilen Görselleri Yükle
            </button>
          </>
        )}
        <ol className="editor-images">
          {items.map((item, index) => (
            <li className="editor-image" key={item.key}>
              <div className="editor-image-preview">
                <Image
                  src={item.preview}
                  alt={item.alt || `Görsel ${index + 1} önizlemesi`}
                  fill
                  unoptimized
                  sizes="160px"
                />
              </div>
              <div className="editor-image-copy">
                <p className="eyebrow">
                  {index === 0 ? "Ana Görsel" : `Görsel ${index + 1}`} /{" "}
                  {item.file ? "Henüz yüklenmedi" : "Hazır"}
                </p>
                <label>
                  Alternatif Metin
                  <input
                    value={item.alt}
                    maxLength={300}
                    placeholder="Görseli kısaca açıklayın"
                    onChange={(event) =>
                      setItems(
                        items.map((image) =>
                          image.key === item.key
                            ? { ...image, alt: event.target.value }
                            : image,
                        ),
                      )
                    }
                  />
                </label>
                {item.error && (
                  <p className="notice error" role="alert">
                    {item.error}
                  </p>
                )}
                <div className="image-actions">
                  <button
                    type="button"
                    className="text-link"
                    aria-label={`Görsel ${index + 1} öne taşı`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Öne Taşı
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    aria-label={`Görsel ${index + 1} arkaya taşı`}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Arkaya Taşı
                  </button>
                  <button
                    type="button"
                    className="text-link danger"
                    aria-label={`Görsel ${index + 1} kaldır`}
                    onClick={() => void remove(item)}
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <details>
          <summary className="text-link">
            Mevcut bir görsel adresi kullan
          </summary>
          <label>
            HTTP veya HTTPS görsel adresi
            <input
              type="url"
              value={legacyUrl}
              onChange={(event) => setLegacyUrl(event.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </label>
          <button
            type="button"
            className="button secondary"
            disabled={items.length >= MAX_PRODUCT_IMAGES || !legacyUrl.trim()}
            onClick={() => {
              try {
                const url = new URL(legacyUrl.trim());
                if (
                  !["https:", "http:"].includes(url.protocol) ||
                  url.username ||
                  url.password ||
                  url.href.length > 2000
                )
                  throw new Error();
                const value = url.href;
                replace([
                  ...items,
                  {
                    key: crypto.randomUUID(),
                    url: value,
                    alt: "",
                    preview: value,
                  },
                ]);
                setLegacyUrl("");
                setMessage("");
              } catch {
                setMessage(
                  "Enter a valid HTTP veya HTTPS görsel adresi without credentials.",
                );
              }
            }}
          >
            Adresi Ekle
          </button>
        </details>
      </fieldset>
      {busy && (
        <p role="status" className="notice">
          Görseller güncelleniyor…
        </p>
      )}
      {message && (
        <p role="alert" className="notice error">
          {message}
        </p>
      )}
    </section>
  );
}
