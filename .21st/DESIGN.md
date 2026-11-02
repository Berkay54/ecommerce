# Özen tasarım bağlamı

## 2 Kasım 2026 — mankenli sezon vitrini

Kullanıcının Loft referansı ve temsili moda çekimi onayıyla ana sayfa genişletildi: tam genişlikte fotoğraf slaytı, büyük bir dikey manken çekimiyle eşleşen asimetrik kış kolajı, denim hikâyesi ve gerçek katalogdan dörder ürün. Orman yeşili/krem kimlik korunur; yerel Manrope başlıklar Georgia italik vurguyla eşleşir. Yönetim ve alışveriş akışlarının görsel sistemi değiştirilmez. İlgili stiller `src/app/home-editorial.css` içinde ayrıdır. Yeni görseller `public/campaigns/winter-city.webp`, `winter-layers.webp`, `denim-city.webp` dosyalarıdır; temsili/AI çekimleri olarak açıklanır. Kaynaklar ve promptlar `docs/HOMEPAGE-ART-DIRECTION.md` içindedir.

21st araştırması: Elegant Carousel (10025). Mevcut CampaignSlider ve ProductGrid yeniden kullanılır; admin kampanyaları, klavye/dokunma/oynatma kontrolleri ve reduced-motion desteği korunur.

## Alışveriş detayları ve işletme ekranları

Ürün galerisinde yerel dialog ile büyütme ve yakınlaştırma; doğrulanmamış ölçü üretmeyen beden rehberi; mobilde aynı sepet formunu kullanan sabit satın alma çubuğu bulunur. Arama alanı mevcut header ölçülerini koruyan klavyeli ürün/kategori önerileriyle genişletildi. Yorumlar yalnızca onaylı satın alma kayıtlarından gelir. Kampanya, yorum, iade ve bildirim yönetimi mevcut admin panelinde sade formlar/paneller kullanır. Harici UI bağımlılığı eklenmedi.

21st araştırması: Async Autocomplete (28514), Shop by Category Grid (29288). Mevcut proje bileşenleri ve native dialog yeniden kullanıldı. CLI bileşen incelemesinde bulgu yok. Kurulum ve sınırlar `docs/STOREFRONT-GROWTH.md` içinde açıklanır.

## Ana sayfa kampanya vitrini

Kullanıcının daha görsel bir vitrin talebiyle ana sayfada büyük Georgia başlıklar, koyu orman yeşili / kum / bordo slayt temaları ve yerel WebP moda fotoğrafları kullanılır. Katalog ve alışveriş akışının mevcut bileşenleri korunur. Kategori kartları editoryal fotoğraf kutuları, bölüm başlıkları numaralı küçük etiketlerle düzenlenir.

Slayt gösterisi 6,5 saniyede bir CSS opacity geçişi yapar. Manuel seçim otomatik geçişi durdurur; klavye, dokunma, durdurma kontrolü, görünürlük ve reduced-motion tercihi desteklenir. Fotoğraflar temsili olarak işaretlenir. İndirim yüzdesi yalnızca yüklenen, stokta bulunan katalog ürünlerinin gerçek fiyatlarından hesaplanır; indirim yoksa genel koleksiyon metni gösterilir. Harici bileşen veya animasyon bağımlılığı eklenmez.

21st araştırması: Hero Carousel (24752), Editorial Collage Hero (19074). Film şeridi gezinmesi ve editoryal başlık/görsel dengesi referans alındı; proje için özgün ve daha sade kontroller uygulandı. Kaynak fotoğraflar: `public/campaigns/SOURCES.md`.

Türkçe, alışıldık e-ticaret gezinmesi. Krem zemin (#fafaf7), beyaz yüzeyler, koyu yeşil metin (#24382d), yeşil CTA (#244b37), ince kenarlıklar (#e2e6df). Arial gövde, yalnızca sezon banner'larında Georgia italik vurgu. 4–6 px kart/düğme köşeleri, ölçülü boşluklar, sinematik animasyon yok.

Başlık: küçük bilgi şeridi, marka + geniş arama + hesap/favoriler/sepet ve kategori gezinmesi. Mobil: hamburger, marka, sepet ve ikinci satırda arama. Ana sayfa: sezon banner'ı, gerçek kategoriler, öne çıkanlar, kampanya ve yeni ürünler. Ürün kartları masaüstünde dört, tablette üç/iki, mobilde iki sütun. Katalog: solda filtreler, mobilde yerel dialog çekmecesi. Detay: büyük görsel, küçük görseller ve varyant/satın alma alanı. Sepet: ürünler + özet; mobilde tek sütun. Yönetim: sade üst menü, okunaklı tablolar ve düzenli formlar.

Sadece gerçek veriler; veri yokken Türkçe boş durumlar. Etkin olmayan üyelik/kupon/bülten/ödeme işlemleri açıkça belirtilir. Tüm fiyatlar tr-TR / TRY. Mevcut Prisma ve sepet yapısı korunur.

21st araştırması: Ecommerce Category Page (29395), Component Search (27914). Harici bileşen kurulmadı; mevcut proje bileşenleri genişletildi. CLI incelemesi çalıştı; native dialog açılış odağı için genel autofocus uyarısı bilinçli olarak korundu. 375/768/1440 px kontrolleri ve masaüstü/mobil görsel incelemeler uygulandı. Genel Arial uyarısı, mevcut görsel dili koruma talebi nedeniyle değiştirilmedi.
