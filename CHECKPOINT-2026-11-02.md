# ModaLife checkpoint — 2 Kasım 2026

## Tamamlananlar

- Marka ve kelime logosu ModaLife; ML sekme simgesi. Merkezi kaynak `src/lib/brand.ts`.
- Mankenli tam genişlikte üç slayt, iki yanda gezinme okları ve metin alanına alınmış indirim etiketi. Geniş ekranda yüzleri koruyan üst hizalama.
- Asimetrik kış bölümü, denim hikâyesi, yerel Manrope yazı tipi ve mobil uyumlu düzen.
- Fotoğraflarda kutu içinde hafif zoom; başlık şeritlerinde renk ve oklarda kısa hareket. Dokunmatik ve reduced-motion tercihleri gözetilir.
- Yedi mevcut demo ürününün kapak fotoğrafları özgün temsili AI manken çekimleriyle güncellendi: dört öne çıkan ürün, Minimal Leather Sneaker ve iki farklı pantolon.
- Ana sayfa, katalog ve detaylar aynı ProductImage kayıtlarını kullanır. Yeni ürün, sipariş veya kullanıcı eklenmedi. Şema ve migration değiştirilmedi.
- Yerel `/product-images/*.webp` adresleri ürün düzenleyicisinde doğrulanır. Yol geçişi ve farklı uzantılar kabul edilmez.
- Windows kurulumundaki geçersiz `prisma skills sync` yerine mevcut `prisma7.config.ts` ile istemci üreten postinstall kullanılır.

## Başka bilgisayarda devam

Gerçek Supabase bağlantısı ve AUTH_SECRET ignored `.env` / `.env.local` içindedir, Git'e eklenmez. Mevcut Supabase projesini kullanın; veritabanını yeniden oluşturmayın. Prisma 7.10.1 ve Next.js 16.4.3 korunur.

```powershell
npm.cmd ci
npx.cmd prisma migrate status --config prisma7.config.ts
npm.cmd run dev
```

Bu çalışma için yeni migration yoktur. Kontrol edilen mevcut dört migration uygulanmış durumdaydı. Yerel geliştirme sırasında eski CSS sunulması sorunu, `.next/dev` önbelleği proje içinde yedeklenip geliştirme sunucusu yeniden başlatılarak giderildi.

Görseller `public/product-images/` ve `public/campaigns/` altında uygulamayla birlikte taşınır. Aynı Supabase veritabanında kapak güncellemeleri zaten kayıtlıdır. Başka mevcut demo veritabanına bu yedi görseli uygulamak gerekirse `node scripts/update-featured-images.cjs` kullanılabilir: yalnızca bilinen demo kapaklarını beklenen eski URL veya aynı yeni URL ile eşleştiğinde günceller; farklı düzenlenmiş kayıtta transaction geri alınır. Tekrar çalıştırmak aynı kayıtları değiştirmez. Seed otomatik çalıştırılmaz.

Promptlar, varlık yolları ve önceki URL'ler: `docs/HOMEPAGE-ART-DIRECTION.md`, `docs/featured-model-images.json`, `docs/leather-sneaker-image.json`, `docs/trouser-model-images.json`. Gerçek satış öncesi temsili katalog fotoğraflarını gerçek ürün çekimleriyle değiştirin.

## Doğrulama ve açık konular

TypeScript, ESLint ve production build başarılı. Tarayıcıda 390/768/1440/1920 px slayt konumları, indirim yerleşimi, hover/reduced-motion, mankenli kartlar ve ürün detay kapakları doğrulandı. Önceki slayt/mağaza sekiz testi ve güncellenen yerel görsel doğrulama testi geçti.

Bu bilgisayarda gerçek Blob, iyzico sandbox ve e-posta anahtarları tanımlı değil. Gerçek yükleme, ödeme/callback ve e-posta gönderim akışları henüz bu ortamda doğrulanmadı. Önceki hesap/sipariş/yönetim özellikleri korunur. Ayrıntılar önceki checkpoint ve `docs/STOREFRONT-GROWTH.md` içindedir.
