# Özen / Şehirde kış

2 Kasım 2026. Kullanıcı, Loft'un mankenli kampanya/slayt anlatımını ve sezon bölümlerini referans gösterdi; Özen için ayrı ve dikkat çeken bir ana sayfa istedi. Temsili moda görsellerinin kullanılmasını onayladı.

## Uygulama

Mevcut Özen yeşil/krem kimliği genişletildi. Tam genişlikte fotoğraf vitrini, okunabilir manken üstü başlıklar, asimetrik kış kolajı, denim bölümü ve aralarında dört gerçek katalog ürünü gösterilir. Yerel Manrope başlıklar Georgia italik vurgularla eşleşir. Yeni stil `src/app/home-editorial.css` içindedir; admin, katalog, sepet ve ödeme tasarımlarına yayılmaz.

Mevcut CampaignSlider yeniden kullanıldı; admin kampanyaları, ok tuşları, dokunma, durdurma/oynatma, sekme görünürlüğü ve reduced-motion davranışı korundu. Üç varsayılan slayt, veritabanında kampanya yokken kullanılır. Kampanya kayıtlarının tamamı pasifse slayt gizlenir. Yeni statik stil bölümleri bağımsızdır. Ürünler ve kategori bağlantıları mevcut Prisma verisinden gelir; stok/ürün/şema değiştirilmez.

21st araştırması: Elegant Carousel (10025), editoryal fotoğraf dengesi için incelendi. Harici bileşen kurulmadı. Loft referans olarak incelendi; fotoğrafları veya kodu projeye kopyalanmadı.

## Varlıklar ve promptlar

Yerleşik imagegen kullanıldı; API/CLI fallback kullanılmadı. Aşağıdaki üretim promptlarının çıktıları incelendi, orijinaller korunup yerel WebP dağıtım kopyaları oluşturuldu.

### public/campaigns/winter-city.webp

Create a photorealistic high-end contemporary Turkish fashion campaign photograph for a clothing storefront. Wide horizontal 3:2 composition. A stylish adult woman wearing an oversized dark chocolate wool coat, cream ribbed turtleneck, dark indigo wide-leg jeans, and an adult man wearing a deep olive bomber jacket over a charcoal knit and black tailored trousers. They stand naturally apart beside a weathered warm limestone modernist building and concrete stairs, Istanbul-inspired urban architecture, no recognizable landmarks, cloudy late autumn daylight, soft realistic shadows, film editorial aesthetic, natural textured fabric, muted forest olive chocolate and off-white palette, serious relaxed expressions, professionally styled. Full body figures head to boots visible with generous breathing room. Both models grouped in RIGHT TWO THIRDS of image, LEFT THIRD is a dark textured stone wall with clean negative space for overlay text. No text, no branding, no logo, no border, no graphic, no watermark. Original fictional models. Image must feel like a real fashion magazine photograph not a glossy AI render.

### public/campaigns/winter-layers.webp

Original photorealistic fashion campaign, portrait vertical 2:3 photograph, full body adult woman in her late 20s with dark wavy hair, wearing long oversized warm camel brown wool coat, chunky oatmeal knit sweater, faded indigo straight leg denim and black leather boots. Relaxed natural pose walking down wide dark stone city stairs, one hand in coat pocket, looking sideways, airy space above head and below boots, crisp November overcast daylight in an Istanbul-inspired stone courtyard, cinematic yet natural fashion editorial, realistic weave of wool and soft authentic skin texture, understated premium streetwear, muted warm taupe olive chocolate palette, shot on 50mm lens, architecturally framed from slightly below, clothing clearly visible. No text, logos, brand marks or watermarks. A believable clothing campaign with an entirely fictional model. No collages, just one single coherent photograph.

### public/campaigns/denim-city.webp

Create one photorealistic premium fashion campaign photograph, wide horizontal 3:2 composition. An adult male fashion model with dark hair wearing authentic dark indigo denim jacket over an off-white cotton T-shirt and straight leg mid-blue denim JEANS, black leather shoes. Full body head to shoes visible with breathing room, standing casually leaning against a pale rough concrete wall with large rectilinear architecture and one clean steel doorway in an understated urban courtyard, afternoon overcast diffuse daylight. Model placed slightly right of centre with a clear fashionable pose looking off camera. Editorial fashion photography, subtle film color, natural texture of denim with visible seams and fade, sophisticated candid calm mood, desaturated indigo and warm grey palette. This is a DENIM jeans campaign; trousers must visibly be blue denim. Entirely fictional model, no logos no brand marks no lettering no watermarks, no collage.

Gerçek kampanya çekimleri hazır olduğunda bu yerel varlıklar ve varsayılan slayt metinleri değiştirilebilir. Ürün kartlarındaki stok fotoğrafları bu işlemle değiştirilmedi; katalog fotoğrafları ürün yönetiminden ayrı güncellenir.

## Doğrulama

TypeScript, ESLint ve production build geçti. Kampanya ve Türkçe mağaza dosyalarındaki sekiz Playwright testi başarılı: klavye/ok kontrolleri, otomatik geçiş ve durdurma, reduced-motion, görsellerin yüklenmesi, kategori/arama/sıralama gezinmesi, favoriler ve 375/768/1440 px taşma kontrolleri. Eski sloganı bekleyen responsive test yeni başlığa güncellendikten sonra tek başına yeniden çalıştırılıp geçti. Bu kontroller katalog veya sipariş verisi değiştirmez.

Masaüstü ve mobil iki turda incelendi; bağımsız tasarım incelemesinin istediği başlık üstü etiket kaldırıldı ve denim görseli yenilendi. Impeccable mekanik dedektör sonucu boş. 21st CLI review yerel npm önbelleğinde araç bulunmadığı için çalışmadı; tarayıcı, bağımsız inceleme ve proje testleriyle doğrulandı.
