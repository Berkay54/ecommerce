import Link from "next/link";
import { currentUser } from "@/lib/auth-user";
import { logout } from "@/app/auth-actions";
import { Icon } from "@/components/icons";
export async function AccountMenu() {
  const user = await currentUser();
  return (
    <details className="account-menu">
      <summary aria-label="Hesabım">
        <Icon name="user" />
        <span>{user ? "Hesabım" : "Giriş Yap"}</span>
      </summary>
      <div className="account-note account-links">
        {user ? (
          <>
            <strong>{user.name || "Hesabım"}</strong>
            <Link href="/hesabim">Hesabım</Link>
            <Link href="/hesabim/siparisler">Siparişlerim</Link>
            {user.role === "ADMIN" && <Link href="/admin">Yönetim Paneli</Link>}
            <form action={logout}>
              <button type="submit" className="text-link">
                Çıkış Yap
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/giris">Giriş Yap</Link>
            <Link href="/kayit">Üye Ol</Link>
          </>
        )}
      </div>
    </details>
  );
}
export async function MobileAccountLinks() {
  const user = await currentUser();
  return user ? (
    <>
      <Link href="/hesabim">Hesabım</Link>
      <Link href="/hesabim/siparisler">Siparişlerim</Link>
      <form action={logout}>
        <button className="text-link">Çıkış Yap</button>
      </form>
    </>
  ) : (
    <>
      <Link href="/giris">Giriş Yap</Link>
      <Link href="/kayit">Üye Ol</Link>
    </>
  );
}
