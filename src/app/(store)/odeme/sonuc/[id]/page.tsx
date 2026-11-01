import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import {
  PaymentCartSettlement,
  PaymentRefresh,
} from "@/components/payment-result";
import { brandTitle } from "@/lib/brand";
export const metadata = { title: brandTitle("Ödeme Sonucu"), robots: { index: false, follow: false } };
type PaymentResultProps = {
  params: Promise<{ id: string }>;
};
export default function PaymentResult(props: PaymentResultProps) {
  return (
    <Suspense
      fallback={
        <main className="wrap order-page" role="status">
          <p>Ödeme sonucu yükleniyor…</p>
        </main>
      }
    >
      <PaymentResultContent {...props} />
    </Suspense>
  );
}
async function PaymentResultContent({ params }: PaymentResultProps) {
  const { id } = await params;
  const user = await requireUser(`/odeme/sonuc/${id}`);
  await connection();
  const payment = await prisma.paymentAttempt.findFirst({
    where: { id, order: { userId: user.id } },
    select: {
      status: true,
      issue: true,
      token: true,
      order: { select: { orderNumber: true } },
    },
  });
  if (!payment) notFound();
  const success = payment.status === "SUCCEEDED";
  const failure = payment.status === "FAILED";
  const review = payment.status === "REVIEW";
  return (
    <main className="wrap order-page">
      <section className="panel">
        <p className="eyebrow">iyzico Sandbox</p>
        <h1>
          {success
            ? "Ödemeniz Başarıyla Alındı"
            : failure
              ? "Ödeme Gerçekleştirilemedi"
              : review
                ? "Ödemeniz İnceleniyor"
                : "Ödeme Sonucu Bekleniyor"}
        </h1>
        <p>
          {success
            ? "Siparişiniz hazırlanmak üzere alındı."
            : failure
              ? "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin."
              : review
                ? "Ödeme bildiriminiz alındı; stok veya ödeme kontrolü için mağaza incelemesi gerekiyor. Yeniden ödeme yapmayın; mağazayla iletişime geçin."
                : "Ödeme sonucu henüz doğrulanmadı. Yeniden ödeme yapmayın; durumunu kontrol edin veya mağazayla iletişime geçin."}
        </p>
        <p>
          Sipariş numarası: <strong>{payment.order.orderNumber}</strong>
        </p>
        {payment.issue === "INVALID_PHONE" && (
          <p className="notice error">
            Ödeme için Adreslerim bölümünden teslimat adresinize geçerli bir
            Türkiye cep telefonu ekleyin, ardından tekrar deneyin.
          </p>
        )}
        {payment.issue === "CART_CHANGED" && (
          <p className="notice error">
            Ürün fiyatı, stok veya adres değişti. Sepetinizi ve teslimat
            adresinizi kontrol edip tekrar deneyin.
          </p>
        )}
        <p className="muted">
          Bu işlem sandbox test ortamına aittir; gerçek tahsilat yapılmaz.
        </p>
        {(success || failure) && (
          <PaymentCartSettlement id={id} succeeded={success} />
        )}
        {!success && !failure && payment.token && <PaymentRefresh id={id} />}
        <div className="account-shortcuts">
          {failure && (
            <Link className="button" href="/checkout">
              Tekrar Dene
            </Link>
          )}
          <Link
            className="button secondary"
            href={`/orders/${payment.order.orderNumber}`}
          >
            Siparişi Görüntüle
          </Link>
          <Link className="text-link" href="/cart">
            Sepete Dön
          </Link>
        </div>
      </section>
    </main>
  );
}
