"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { BRAND_WORDMARK } from "@/lib/brand";

export type CampaignSlide = {
  id: string;
  label: string;
  title: string;
  emphasis: string;
  description: string;
  href: string;
  action: string;
  image: string;
  alt: string;
  theme: "forest" | "sand" | "wine";
  note: string;
  offer?: string;
};

export function CampaignSlider({ slides }: { slides: CampaignSlide[] }) {
  const [activeIndex, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    const updateVisibility = () => setVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  const playing =
    !paused && !reducedMotion && visible && inView && !hovered && !focused;
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);

  if (!slides.length) return null;
  const active = Math.min(activeIndex, slides.length - 1);
  function select(index: number) {
    setActive((index + slides.length) % slides.length);
    setPaused(true);
  }

  return (
    <section
      ref={root}
      className={`campaign-slider theme-${slides[active].theme}`}
      aria-label="Sezon kampanyaları"
      aria-roledescription="slayt gösterisi"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          select(active + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(distance) > 60) select(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="campaign-slides" aria-live={playing ? "off" : "polite"}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`campaign-slide${index === active ? " is-active" : ""} theme-${slide.theme}`}
            role="group"
            aria-roledescription="slayt"
            aria-label={`${index + 1} / ${slides.length}: ${slide.label}`}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            <div className="campaign-copy">
              {index === 0 ? (
                <h1>
                  {slide.title}
                  <em>{slide.emphasis}</em>
                </h1>
              ) : (
                <h2>
                  {slide.title}
                  <em>{slide.emphasis}</em>
                </h2>
              )}
              <p>{slide.description}</p>
              <div className="campaign-actions">
                <Link href={slide.href} className="campaign-cta">
                  {slide.action}
                  <Icon name="arrow" width={20} />
                </Link>
                {slide.offer && (
                  <div className="campaign-offer">
                    <strong>{slide.offer}</strong>
                    <span>varan indirimler</span>
                  </div>
                )}
              </div>
              <span className="campaign-footnote">{slide.note}</span>
            </div>
            <div className="campaign-photo">
              <Image
                src={slide.image}
                unoptimized={slide.image.startsWith("https://")}
                alt={slide.alt}
                fill
                sizes="100vw"
                preload={index === 0}
              />
              <span className="campaign-wordmark" aria-hidden="true">
                {BRAND_WORDMARK}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="campaign-controls">
        <span className="campaign-counter" aria-hidden="true">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </span>
        <div className="campaign-dots" aria-label="Kampanya seçimi">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${slide.label} slaydını göster`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => select(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </button>
          ))}
        </div>
        <div className="campaign-arrows">
          {!reducedMotion && (
            <button
              type="button"
              aria-label={paused ? "Slaytları oynat" : "Slaytları durdur"}
              onClick={() => setPaused(!paused)}
            >
              <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
            </button>
          )}
        </div>
      </div>
      <button
        className="campaign-side-arrow campaign-previous"
        type="button"
        aria-label="Önceki kampanya"
        onClick={() => select(active - 1)}
      >
        <Icon name="arrow" className="arrow-back" width={22} />
      </button>
      <button
        className="campaign-side-arrow campaign-next"
        type="button"
        aria-label="Sonraki kampanya"
        onClick={() => select(active + 1)}
      >
        <Icon name="arrow" width={22} />
      </button>
      <span className="campaign-image-credit">
        Stil ilhamı · Temsili görseller
      </span>
    </section>
  );
}
