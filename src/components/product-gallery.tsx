"use client";
import Image from "next/image";
import { useRef, useState } from "react";
export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string; alt: string | null }[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = images[index] ?? images[0];
  return (
    <div className="gallery">
      <div className="detail-image">
        {selected ? (
          <Image
            key={selected.id}
            src={selected.url}
            alt={selected.alt || name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <span className="no-image">Görsel hazırlanıyor</span>
        )}
      </div>
      {selected && (
        <button
          type="button"
          className="gallery-enlarge text-link"
          onClick={() => {
            setZoomed(false);
            dialog.current?.showModal();
          }}
        >
          Görseli büyüt ↗
        </button>
      )}
      {images.length > 1 && (
        <div className="gallery-thumbnails" aria-label="Ürün görselleri">
          {images.map((image, i) => (
            <button
              type="button"
              aria-label={`Ürün görseli ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
              key={image.id}
            >
              <Image
                src={image.url}
                alt={image.alt || name}
                fill
                unoptimized
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
      {selected && (
        <dialog
          ref={dialog}
          className="product-lightbox"
          aria-label={`${name} görsel inceleme`}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              setZoomed(false);
              setIndex(
                (index +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  images.length) %
                  images.length,
              );
            }
          }}
        >
          <div className="lightbox-toolbar">
            <strong>{name}</strong>
            <button
              type="button"
              className="text-link"
              onClick={() => dialog.current?.close()}
            >
              Kapat ✕
            </button>
          </div>
          <div className="lightbox-scroll">
            <Image
              className={zoomed ? "zoomed" : ""}
              src={selected.url}
              alt={selected.alt || name}
              width={1600}
              height={1600}
              unoptimized
            />
          </div>
          <div className="lightbox-toolbar">
            <button
              type="button"
              onClick={() => {
                setZoomed(false);
                setIndex((index - 1 + images.length) % images.length);
              }}
              disabled={images.length < 2}
            >
              ← Önceki
            </button>
            <span>
              {index + 1} / {images.length}
            </span>
            <button type="button" onClick={() => setZoomed(!zoomed)}>
              {zoomed ? "Uzaklaştır" : "Yakınlaştır"}
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomed(false);
                setIndex((index + 1) % images.length);
              }}
              disabled={images.length < 2}
            >
              Sonraki →
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
