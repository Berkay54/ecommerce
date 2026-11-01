import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
const pages: Record<string, { title: string; copy: string }> = {
  hakkimizda: {
    title: "Hakkımızda",
    copy: "Form & Field, günlük yaşam için özenle seçilmiş ürünleri bir araya getirir. Koleksiyonumuzu keşfedebilir ve favorilerinizi bu tarayıcıda kaydedebilirsiniz.",
  },
  iletisim: {
    title: "İletişim",
    copy: "Mağazanın doğrulanmış iletişim bilgileri henüz yayımlanmadı. Müşteri destek kanalları bu sayfada paylaşılacaktır.",
  },
  magazalar: {
    title: "Mağazalar",
    copy: "Henüz yayımlanmış bir fiziksel mağaza adresi bulunmuyor. Güncel koleksiyonu online mağazamızda inceleyebilirsiniz.",
  },
  sss: {
    title: "Sıkça Sorulan Sorular",
    copy: "Ürünleri üye olmadan sepetinize ekleyebilirsiniz. Sipariş için giriş yapıp teslimat adresi seçmeniz gerekir. Sepet ve favoriler bu tarayıcıda saklanır. Ödeme iyzico sandbox test ortamındadır; gerçek tahsilat yapılmaz. Kupon entegrasyonu henüz aktif değildir.",
  },
  kargo: {
    title: "Kargo ve Teslimat",
    copy: "750 TL ve üzeri siparişlerde ücretsiz kargo avantajı planlanmaktadır. Sipariş kaydı oluşturulabilir ancak kargo entegrasyonu henüz bağlı değildir. Kargo bedeli sipariş toplamına eklenmez. Teslimat süreleri ve seçenekleri daha sonra paylaşılacaktır.",
  },
  iade: {
    title: "İade ve Değişim",
    copy: "14 gün içinde kolay iade politikası planlanmaktadır. İade kapsamı, istisnalar ve başvuru yöntemi henüz yayımlanmamıştır. Otomatik iade veya geri ödeme işlemi yapılmaz.",
  },
  gizlilik: {
    title: "Gizlilik Politikası",
    copy: "Onaylanmış gizlilik politikası henüz yayımlanmadı. Bu sayfa tamamlanmış bir hukuki metin değildir. Hesap, adres ve sipariş bilgileri mağazada saklanır. Ödeme için gereken kimlik bilgisi iyzico'ya iletilir; mağaza veritabanında tutulmaz. Kart bilgileri iyzico'nun sandbox sayfasında girilir ve mağazada saklanmaz.",
  },
  kvkk: {
    title: "KVKK",
    copy: "Veri sorumlusu bilgileri ve KVKK aydınlatma metni henüz yayımlanmadı. Bu bilgiler mağaza işletmecisi tarafından tamamlandığında bu sayfada paylaşılacaktır.",
  },
  "satis-sozlesmesi": {
    title: "Mesafeli Satış Sözleşmesi",
    copy: "Sipariş kaydı oluşturulabilir ancak bu aşamada ödeme alınmaz. Satıcı bilgileri ve onaylanmış mesafeli satış sözleşmesi henüz yayımlanmamıştır. Bu sayfa tamamlanmış bir sözleşme değildir.",
  },
  cerezler: {
    title: "Çerez Politikası",
    copy: "Sepet ve favoriler, işlevlerini sürdürebilmek için bu tarayıcının yerel depolamasını kullanır. Tarayıcı verilerini temizlediğinizde bu seçimler de silinir. Tam çerez politikası henüz yayımlanmadı.",
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
type InfoPageProps = {
  params: Promise<{ slug: string }>;
};
export default function InfoPage(props: InfoPageProps) {
  return (
    <Suspense
      fallback={
        <main className="wrap info-page" role="status">
          <p>Bilgiler yükleniyor…</p>
        </main>
      }
    >
      <InfoContent {...props} />
    </Suspense>
  );
}
async function InfoContent({ params }: InfoPageProps) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <main className="wrap info-page">
      <nav className="breadcrumb" aria-label="Sayfa yolu">
        <Link href="/">Ana Sayfa</Link>
        <span>/</span>
        <span>{page.title}</span>
      </nav>
      <h1>{page.title}</h1>
      <p>{page.copy}</p>
      <Link href="/products" className="button">
        Ürünleri Keşfet
      </Link>
    </main>
  );
}
