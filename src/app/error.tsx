"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="wrap empty">
      <p className="eyebrow">Please try again</p>
      <h1>We could not load this page.</h1>
      <p>The store is temporarily unavailable. Please try again in a moment.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
