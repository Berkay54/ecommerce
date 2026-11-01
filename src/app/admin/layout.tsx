import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { requireAdmin } from "@/lib/auth-user";
import { logout } from "@/app/auth-actions";
export const metadata = { title: "Yönetim Paneli · Form & Field" };
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ProtectedAdmin>{children}</ProtectedAdmin>
    </Suspense>
  );
}
async function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="wrap">
          <Link href="/admin" className="brand">
            FORM<span>&</span>FIELD <small>YÖNETİM</small>
          </Link>
          <nav aria-label="Yönetim menüsü">
            <Link href="/admin/products">Ürünler</Link>
            <Link href="/admin/categories">Kategoriler</Link>
            <Link href="/admin/orders">Siparişler</Link>
            <Link href="/" className="admin-store-link">
              Mağazayı Gör
            </Link>
          </nav>
        </div>
      </header>
      <div className="admin-context wrap">
        <span>Mağaza Yönetimi</span>
        <span>Form & Field</span>
      </div>
      <main className="wrap admin">{children}</main>
      <footer className="wrap admin-footer">
        <span>© 2026 Form & Field · Yönetim Paneli</span>
        <form action={logout}>
          <button className="text-link">Çıkış Yap</button>
        </form>
      </footer>
    </div>
  );
}
