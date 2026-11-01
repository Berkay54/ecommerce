"use client";
import Image from "next/image";
import { useState } from "react";
export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string; alt: string | null }[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
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
    </div>
  );
}
