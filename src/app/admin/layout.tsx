import Link from "next/link";
export const metadata = { title: "Studio admin / Form & Field" };
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="site-header wrap">
        <Link href="/admin" className="brand">
          FORM<span>&</span>FIELD <small>STUDIO</small>
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/">View store</Link>
        </nav>
      </header>
      <main className="wrap admin">{children}</main>
      <footer className="wrap footer">
        <p>Studio workspace / Authentication is not enabled.</p>
      </footer>
    </>
  );
}
