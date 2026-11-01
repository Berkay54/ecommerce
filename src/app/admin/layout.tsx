import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { requireAdmin } from "@/lib/auth-user";
import { logout } from "@/app/auth-actions";
import { BRAND_NAME, BRAND_WORDMARK, brandTitle } from "@/lib/brand";
export const metadata = {
  title: brandTitle("Yönetim Paneli"),
  robots: { index: false, follow: false },
};
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
          <Link
            href="/admin"
            className="brand"
            aria-label={`${BRAND_NAME} yönetim paneli`}
          >
            {BRAND_WORDMARK} <small>YÖNETİM</small>
          </Link>
          <nav aria-label="Yönetim menüsü">
            <Link href="/admin/products">Ürünler</Link>
            <Link href="/admin/categories">Kategoriler</Link>
            <Link href="/admin/orders">Siparişler</Link>
            <Link href="/admin/campaigns">Kampanyalar</Link>
            <Link href="/admin/reviews">Yorumlar</Link>
            <Link href="/admin/returns">İadeler</Link>
            <Link href="/admin/notifications">Bildirimler</Link>
            <Link href="/admin/readiness">Yayına Hazırlık</Link>
            <Link href="/" className="admin-store-link">
              Mağazayı Gör
            </Link>
          </nav>
        </div>
      </header>
      <div className="admin-context wrap">
        <span>Mağaza Yönetimi</span>
        <span>{BRAND_NAME}</span>
      </div>
      <main className="wrap admin">{children}</main>
      <footer className="wrap admin-footer">
        <span>© 2026 {BRAND_NAME} · Yönetim Paneli</span>
        <form action={logout}>
          <button className="text-link">Çıkış Yap</button>
        </form>
      </footer>
    </div>
  );
}
