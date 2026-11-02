import type { CampaignSlide } from "@/components/campaign-slider";
import { BRAND_NAME } from "@/lib/brand";
export function defaultCampaigns(maxDiscount: number): CampaignSlide[] {
  return [
    {
      id: "season",
      label: `Yeni sezon / ${BRAND_NAME} seçkisi`,
      title: "Şehir soğur.",
      emphasis: "Stilin kalır.",
      description:
        "Katmanlar, güçlü dokular ve sana ait bir duruş. Yeni mevsime kendi ritminde gir.",
      href: "/products?sort=newest",
      action: "Yeni sezonu keşfet",
      image: "/campaigns/winter-city.webp",
      alt: "Taş bir avluda koyu kaban ve zeytin yeşili ceket giyen iki manken; temsili kış çekimi",
      theme: "forest",
      note: `Sonbahar / Kış — ${BRAND_NAME}`,
    },
    {
      id: "offers",
      label: maxDiscount > 0 ? "Seçili ürünlerde indirim" : "Keşfetmeye değer",
      title: maxDiscount > 0 ? "Aklında kalan," : "Sokağa çık.",
      emphasis: maxDiscount > 0 ? "üzerinde olsun." : "Kendin ol.",
      description:
        maxDiscount > 0
          ? "Aklındaki parçaya bir adım daha yakınsın. Güncel indirimleri keşfet, favorini seç."
          : "Gardırobuna yeni bir hikâye ekle. Sana iyi gelen parçaları keşfet.",
      href: maxDiscount > 0 ? "/products?campaign=1" : "/products",
      action: maxDiscount > 0 ? "İndirimleri keşfet" : "Koleksiyonu keşfet",
      image: "/campaigns/winter-layers.webp",
      alt: "Deve tüyü kaban, triko ve jean giyen manken; temsili sezon çekimi",
      theme: "sand",
      note: "Güncel fiyatlar ürün sayfalarındadır.",
      ...(maxDiscount > 0 ? { offer: "%" + maxDiscount + "'ye" } : {}),
    },
    {
      id: "edit",
      label: "Az parça, çok olasılık",
      title: "Her güne",
      emphasis: "biraz stil.",
      description:
        "Rahat kalıplar, sade detaylar. Günün nereye götürürse, stilin seninle gelsin.",
      href: "/products?featured=1",
      action: "Seçkiyi incele",
      image: "/campaigns/denim-city.webp",
      alt: "Jean ceket ve mavi jean pantolonla erkek manken; temsili şehir çekimi",
      theme: "wine",
      note: "Senin stilin. Senin hikâyen.",
    },
  ];
}
