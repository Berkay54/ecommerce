import Link from "next/link";
export const metadata = { title: "Ödeme Gerçekleştirilemedi · Form & Field" };
export default function PaymentFailure() {
  return (
    <main className="wrap order-page">
      <section className="panel">
        <h1>Ödeme Gerçekleştirilemedi</h1>
        <p>Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.</p>
        <p className="muted">
          Kart işlemi yaptıysanız yeniden ödeme yapmadan önce Siparişlerim
          bölümünden durumunu kontrol edin.
        </p>
        <div className="account-shortcuts">
          <Link className="button" href="/hesabim/siparisler">
            Siparişlerim
          </Link>
          <Link className="button secondary" href="/cart">
            Sepete Dön
          </Link>
        </div>
      </section>
    </main>
  );
}
