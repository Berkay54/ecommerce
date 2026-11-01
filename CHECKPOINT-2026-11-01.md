# Ecommerce checkpoint — 1 Kasım 2026

Mevcut uygulama korunarak tamamlanan aşamalar:

- Türkçe storefront, kategori/ürün filtreleri, favoriler ve mevcut admin CRUD.
- Vercel Blob görsel yükleme altyapısı; çoklu görsel, alt metin ve sıralama.
- Kalıcı misafir sepeti, varyant seçimi ve sunucu taraflı stok kontrolü.
- Auth.js müşteri hesabı, USER/ADMIN rolleri, adres yönetimi.
- Checkout, siparişlerim ve admin sipariş yönetimi.
- iyzico sandbox Checkout Form; doğrulanmış callback, idempotency ve ödeme sonrası atomik stok düşümü.
- Next.js Instant uyarıları için dinamik sayfalar ve URL parametrelerinde sayfa içi Suspense sınırları.

## Sürümler

Next.js 16.4.3, Prisma/Client 7.10.1, Auth.js 5.0.0-beta.32, iyzipay 2.0.71. `prisma7.config.ts` kullanılır; Prisma yükseltilmedi.

## Başka PC'de devam

1. `.env.example` içindeki değişkenleri inceleyin. Gerçek değerleri ignored `.env` / `.env.local` dosyalarında veya deployment environment ayarlarında tanımlayın; bu dosyalar checkpoint'e dahil değildir.
2. Mevcut veritabanına bağlanın; reset veya yeniden kurulum yapmayın. Bu PC'de Supabase kullanılıyor. Önce salt okunur migration durumunu kontrol edin.

```powershell
npm.cmd ci
npx.cmd prisma migrate status --config prisma7.config.ts
npm.cmd run db:generate
npm.cmd run dev
```

Yeni bir ortamda eksik migration varsa `npx.cmd prisma migrate deploy --config prisma7.config.ts` kullanılır. İlk gerçek yönetici için önce gerçek kullanıcı kaydı oluşturulur, sonra `npm.cmd run admin:promote -- "gercek-eposta"` çalıştırılır. Mock kullanıcı/ürün/sipariş seed'i yoktur.

## Doğrulama ve açık noktalar

- Son TypeScript ve production build başarılı. ESLint: 0 hata, mevcut `prisma7.config.ts` unused `env` importu için 1 uyarı.
- Son tam Playwright paketi: 18 geçti, 13 koşullu test atlandı. Daha sonraki footer düzeltmesinde 10 bilgi bağlantısı development ortamında tıklanarak doğrulandı; Instant/browser hatası görülmedi.
- Oturumlu `/hesabim/siparisler` uyarısı giderildikten sonra Next.js MCP canlı hata listesi boş döndü. Kullanıcı daha sonra ekranda hata görünmediğini doğruladı.
- Görsel yüklemek için public Vercel Blob deposu ve `BLOB_READ_WRITE_TOKEN` gerekir. Son kontrolde token tanımlı değildi; gerçek yükleme henüz doğrulanmadı. Bekleyen yüklemeler kaldırılarak görselsiz ürün kaydedilebilir veya mevcut bir görsel URL'si kullanılabilir.
- Gerçek iyzico sandbox kart/callback/stok düşümü akışı henüz uçtan uca doğrulanmadı. Production ödeme, iade/ödeme iptali, kargo API ve e-fatura eklenmedi.

Önceki aşamaların ayrıntıları: `TASARIM-RAPORU.md`, `HESAP-SIPARIS-RAPORU.md`, `IYZICO-SANDBOX-RAPORU.md`. Güncel stok/ödeme davranışında sandbox raporu geçerlidir.
