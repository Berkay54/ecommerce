import Link from "next/link";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { requireUser } from "@/lib/auth-user";
import { logout } from "@/app/auth-actions";
export const metadata = { title: "Hesabım · Form & Field" };
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}
async function AccountShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <main className="wrap account-page">
      <div className="account-heading">
        <h1>Hesabım</h1>
        <p>Merhaba, {user.name || "hoş geldiniz"}.</p>
      </div>
      <div className="account-layout">
        <aside className="panel account-navigation">
          <nav aria-label="Hesap menüsü">
            <Link href="/hesabim">Hesap Bilgilerim</Link>
            <Link href="/hesabim/adresler">Adreslerim</Link>
            <Link href="/hesabim/siparisler">Siparişlerim</Link>
            {user.role === "ADMIN" && <Link href="/admin">Yönetim Paneli</Link>}
            <form action={logout}>
              <button className="text-link">Çıkış Yap</button>
            </form>
          </nav>
        </aside>
        <div className="account-content">{children}</div>
      </div>
    </main>
  );
}
