import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { siteOrigin, publicIndexing } from "@/lib/site";
import { emailConfiguration } from "@/lib/order-notifications";
export default function Readiness() {
  return (
    <Suspense fallback={<p>Kontroller yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  await connection();
  const demoCount = await prisma.product.count({
    where: { active: true, slug: { startsWith: "demo-" } },
  });
  const missingImages = await prisma.product.count({
    where: { active: true, images: { none: {} } },
  });
  const realProducts = await prisma.product.count({
    where: { active: true, NOT: { slug: { startsWith: "demo-" } } },
  });
  const checks = [
    {
      name: "HTTPS alan adı",
      ready: !!siteOrigin(),
      copy: "NEXT_PUBLIC_APP_URL gerçek HTTPS mağaza adresi olmalı.",
    },
    {
      name: "Görsel depolama",
      ready: !!process.env.BLOB_READ_WRITE_TOKEN,
      copy: "Vercel Blob mağazası bağlayıp gerçek ürün fotoğraflarını yükleyin.",
    },
    {
      name: "Sipariş e-postaları",
      ready: emailConfiguration(),
      copy: "Resend alan adı, API anahtarı, gönderen ve gönderim bayrağı gerekiyor.",
    },
    {
      name: "Bildirim yeniden denemesi",
      ready: !!process.env.CRON_SECRET,
      copy: "Korumalı /api/cron/notifications için zamanlayıcıyı ayrıca kurun. Anahtar tanımlı olması zamanlayıcının çalıştığını doğrulamaz.",
    },
    {
      name: "Gerçek katalog",
      ready: realProducts > 0 && demoCount === 0,
      copy: `${realProducts} gerçek, ${demoCount} aktif demo ürün. Yayından önce demo ürünleri admin panelinden pasif yapın.`,
    },
    {
      name: "Ürün görselleri",
      ready: missingImages === 0,
      copy: `${missingImages} aktif ürünün görseli yok. Fotoğrafların ürünle eşleştiğini elle kontrol edin.`,
    },
    {
      name: "Arama motoru yayını",
      ready: publicIndexing(),
      copy: "Gerçek katalog ve içerikler hazır olduğunda STORE_PUBLIC_INDEXING=true yapın. Şu anda varsayılan kapalıdır.",
    },
    {
      name: "Canlı ödeme",
      ready: false,
      copy: "Mevcut iyzico bağlantısı sandbox ile sınırlıdır. Canlı ödeme aktivasyonu bu çalışma kapsamında açılmadı.",
    },
  ];
  return (
    <>
      <h1>Yayına Hazırlık</h1>
      <p className="muted">
        Bu ekran yapılandırma varlığını kontrol eder. Hesapların, DNS
        yapılandırmasının veya sağlayıcı bağlantılarının başarılı olduğunu
        otomatik olarak doğrulamaz.
      </p>
      <div className="readiness-grid">
        {checks.map((check) => (
          <section className="panel" key={check.name}>
            <span className="status">
              {check.ready ? "Tanımlı / Uygun" : "Tamamlanmalı"}
            </span>
            <h2>{check.name}</h2>
            <p>{check.copy}</p>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>Son Manuel Kontroller</h2>
        <p>
          Firma ve iletişim bilgileri, iade koşulları, satış sözleşmesi ve
          gizlilik metinlerini işletmenize göre tamamlayın. Gerçek cihazlarda
          alışveriş akışını ve ödeme mutabakatını doğrulayın. Veritabanı
          yedeğini ve sağlayıcı hata bildirimlerini kontrol edin.
        </p>
      </section>
    </>
  );
}
