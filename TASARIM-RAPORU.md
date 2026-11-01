# Türkçe e-ticaret tasarım raporu

## 1. Değiştirilen dosyalar

Bu liste bu tasarım aşamasını kapsar. Önceki sepet ve görsel yükleme çalışmaları korunmuştur.

| Alan | Dosyalar |
| --- | --- |
| Görünüm ve dil | `src/app/globals.css`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx` |
| Mağaza | `src/app/(store)/layout.tsx`, `page.tsx`, `products/page.tsx`, `products/[slug]/page.tsx`, `cart/page.tsx` |
| Yeni sayfalar | `src/app/(store)/kategoriler/page.tsx`, `src/app/(store)/bilgi/[slug]/page.tsx` |
| Bileşenler | `src/components/catalog.tsx`, `catalog-filters.tsx`, `store-actions.tsx`, `icons.tsx`, `product-gallery.tsx`, `add-to-cart.tsx`, `cart.tsx` |
| Yönetim | `src/app/admin/layout.tsx`, `categories/page.tsx`, `products/page.tsx`, `products/new/page.tsx`, `products/[id]/page.tsx`, `src/components/product-form.tsx`, `admin-controls.tsx`, `product-images.tsx` |
| Mesajlar ve fiyat | `src/lib/catalog.ts`, `cart.ts`, `images.ts`, `validation.ts`, `src/components/cart-provider.tsx`, `src/app/api/cart/route.ts`, `src/app/admin/actions.ts`, `src/app/api/admin/images/route.ts` |
| Kontroller ve belgeler | `src/lib/prisma.ts`, `eslint.config.mjs`, `tests/cart.spec.ts`, `tests/images.spec.ts`, `tests/storefront-tr.spec.ts`, `.21st/DESIGN.md`, `README.md`, bu rapor |

`prisma7.config.ts`, Prisma şeması ve migrasyonlar bu aşamada değiştirilmedi. Önceden bulunan `fix-db.cjs` ve `create-migrations-table.sql` çalıştırılmadı veya silinmedi. Yeni bağımlılık kurulmadı; önceki aşamanın paket değişiklikleri korundu.

## 2. Türkçeleştirilen alanlar

Mağaza menüsü, arama, kategori bağlantıları, ürün kartları, ürün detayı, sepet çekmecesi, sepet sayfası ve altbilgi Türkçeleştirildi. Yönetim ürün/kategori ekranları, ürün düzenleme formu, varyant/stok alanları, silme onayı, yayın durumu ve görsel düzenleyicisi de buna dahil.

Boş, yükleniyor ve hata durumları; sunucu doğrulama mesajları; stok/sepet bildirimleri ve erişilebilirlik etiketleri Türkçedir. Sayfa dili `tr`, fiyat biçimi `tr-TR` / `TRY` olarak ayarlandı. Türkçe ürün adından URL üretiminde noktasız `ı` desteklenir.

Marka adı ve mevcut kayıtların içerikleri değiştirilmedi. **Kur dönüşümü yapılmadı:** mevcut sayısal fiyatlar TL olarak gösterilir ve yönetilir. Şemada para birimi alanı bulunmuyor.

## 3. E-ticaret tasarım değişiklikleri

- Krem/beyaz yüzeyler ve koyu yeşil renkler korundu. Belirgin düğmeler, tutarlı kartlar ve sade yönetim yüzeyleri kullanıldı.
- Üst bilgi şeridi, merkezi arama, hesap bilgilendirmesi, favoriler, rozetli sepet ve dinamik kategori menüsü eklendi. Mobilde hamburger, logo, arama ve sepet düzeni bulunur.
- Ana sayfa: sezon banner'ı, gerçek kategoriler, yalnızca `featured=true` ürünler, kampanya banner'ı, en yeni ürünler ve avantaj alanları.
- Banner görseli mevcut katalogdan seçilir; görsel yoksa tipografik alan gösterilir. Sahte ürün veya kategori oluşturulmaz.
- Ürün kartları masaüstünde dört, tablette üç/iki, mobilde iki sütundur. Görsel oranı, favori düğmesi, fiyatlar, indirim oranı ve stok rozetleri tutarlıdır.
- Katalogda masaüstü filtre paneli, mobil filtre çekmecesi, sıralama, ürün sayısı ve sayfalama vardır.
- Ürün detayında küçük görselli galeri, varyanta göre stok kodu/fiyat, adet kontrolü, Sepete Ekle, favori ve açıklama/teslimat/iade alanları bulunur.
- Sepet sayfası ürünler ve sipariş özeti olarak iki sütundur; mobilde alt alta geçer. Çekmece aynı sepet verisini kullanır.
- Kurumsal, yardım ve yasal bağlantılar gerçek bilgi sayfalarına gider. Bülten kaydı henüz etkin değildir.

## 4. Çalışan özellikler ve kontroller

Arama; ürün adı, açıklama, kategori adı ve stok kodunda gerçek PostgreSQL sorgularını kullanır. Ayrı marka modeli eklenmedi; ürün adındaki marka metni aranabilir. Kategori, fiyat aralığı, stok, öne çıkanlar ve gerçek eski-fiyat indirimi filtreleri birlikte çalışır. Filtre ve sıralama seçimleri URL'de korunur.

Önerilen, en yeni, artan/azalan fiyat ve mevcut sipariş satırı sayısına göre sıralama desteklenir. Favoriler tarayıcıda saklanır ve Favorilerim katalog görünümüne bağlanır.

Mevcut ürün/kategori CRUD, varyant, stok, sepet sağlayıcısı ve sunucu stok/fiyat doğrulaması korunmuştur. Görsel depolama entegrasyonunun davranışı değiştirilmedi; yalnızca metinleri ve görünümü düzenlendi. Aynı Node sürecinde tek Prisma istemcisi ve en fazla beş bağlantılık havuz kullanılarak üretim sayfaları arasında bağlantı çoğalması sınırlandırıldı.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

TypeScript ve üretim derlemesi başarılı. ESLint sıfır hatayla tamamlandı; önceden değiştirilmiş `prisma7.config.ts` dosyasında kullanılmayan `env` importu için bir uyarı var. Kullanıcının Prisma yapılandırması korunmuştur. CommonJS yardımcı dosyalarında CommonJS import biçimine izin verilmiştir.

Tarayıcı paketinde 13 test geçti, iki gerçek ürün gerektiren test atlandı. `/`, `/products`, `/cart`, `/admin` ve `/admin/products/new` sayfaları 375, 768 ve 1440 pikselde kontrol edildi; yatay taşma görülmedi. Tamamlanmış sayfaların masaüstü/mobil ekran görüntüleri incelendi. Menü, arama, sıralama, mobil filtreler, çekmece odağı/Escape, bozuk sepeti temizleme ve ağ hatasından sonra yeniden deneme doğrulandı.

Testlerde mevcut `ecommerce-home` yerel Prisma servisi bağlantıları kesti. Mevcut örnek ve sahipsiz boş servis kilidi, veritabanı dosyaları korunarak yeniden başlatıldı; `.env` değiştirilmedi. Veri sıfırlama veya şema değiştirme komutu çalıştırılmadı. Yeni test sunucusu süreçleri açıldığında yerel serviste aralıklı bağlantı kesintileri tekrar gözlendi; servis yeniden başlatıldıktan sonraki son paket sonucu aşağıdaki başarı sayısına dayanır. Bu yerel servis sorunu tamamen giderilmiş sayılmamalıdır.

## 5. Henüz etkin olmayan veya veri gerektiren alanlar

- Üyelik, ödeme, sipariş tamamlama ve kargo API'si eklenmedi.
- Kupon ve bülten alanları açıkça devre dışıdır; başarılı işlem taklidi yapmaz.
- Kargo ücreti servis olmadan uydurulmaz. 750 TL altındaki sepette henüz hesaplanmadığı ve toplama dahil olmadığı belirtilir. Eşik üzerindeki ücretsiz kargo, verilen tasarım politikasına dayanır.
- Ödeme altyapısı olmadığından doğrulanmamış “256-bit SSL ile korunan ödeme” iddiası kullanılmaz.
- İletişim ve hukuki sayfalarda içeriklerin henüz yayımlanmadığı belirtilir; gerçek adres veya sözleşme uydurulmaz.
- Veritabanında ürün ve kategori yoktur. Dolu ürün kartları, gerçek varyantla sepete ekleme, ürün galerisi ve favorilerin uçtan uca testi gerçek kayıtlar eklendiğinde çalıştırılmalıdır. İlgili testler veri yokken açıkça atlanır.
- Vercel Blob kurulumu veya yeni harici görsel depolama çalışması yapılmadı. Önceki entegrasyon ve URL uyumluluğu korundu.
