import Link from "next/link";
import { Suspense } from "react";
import AccountLoading from "@/app/(store)/hesabim/loading";
import { requireUser } from "@/lib/auth-user";
import { orderDate } from "@/lib/order-display";
export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent />
    </Suspense>
  );
}
async function AccountContent() {
  const user = await requireUser();
  return (
    <section className="panel">
      <h2>Hesap Bilgilerim</h2>
      <dl className="account-info">
        <div>
          <dt>Ad Soyad</dt>
          <dd>{user.name || "Belirtilmedi"}</dd>
        </div>
        <div>
          <dt>E-posta</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Üyelik Tarihi</dt>
          <dd>{orderDate(user.createdAt)}</dd>
        </div>
      </dl>
      <div className="account-shortcuts">
        <Link href="/hesabim/adresler" className="button secondary">
          Adreslerimi Yönet
        </Link>
        <Link href="/hesabim/siparisler" className="button secondary">
          Siparişlerimi Gör
        </Link>
      </div>
    </section>
  );
}
