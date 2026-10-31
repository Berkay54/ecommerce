import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap empty">
      <p className="eyebrow">404 / Not found</p>
      <h1>This page has moved on.</h1>
      <Link href="/products" className="button">
        Explore the collection
      </Link>
    </main>
  );
}
