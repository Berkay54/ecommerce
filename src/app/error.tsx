"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="wrap empty">
      <p className="eyebrow">Lütfen tekrar deneyin</p>
      <h1>Sayfa yüklenemedi</h1>
      <p>Mağazaya şu anda ulaşılamıyor. Biraz sonra tekrar deneyin.</p>
      <button className="button" onClick={reset}>
        Tekrar Dene
      </button>
    </main>
  );
}
