import type { CampaignSlide } from "@/components/campaign-slider";
export function defaultCampaigns(maxDiscount: number): CampaignSlide[] {
  return [
    {
      id: "season",
      label: "Yeni sezon / Özen seçkisi",
      title: "Kendi ritmini",
      emphasis: "yakala.",
      description:
        "Biraz renk. Biraz özgürlük. Her gün yeniden keşfedeceğin bir stil.",
      href: "/products?sort=newest",
      action: "Yeni sezonu keşfet",
      image: "/campaigns/editorial.webp",
      alt: "Açık havada sarı eşofman takımıyla moda çekimi",
      theme: "forest",
      note: "Gündelik hayata, özenle.",
    },
    {
      id: "offers",
      label: maxDiscount > 0 ? "Seçili ürünlerde indirim" : "Keşfetmeye değer",
      title: maxDiscount > 0 ? "İyi seçimler," : "Yeni favorin,",
      emphasis: maxDiscount > 0 ? "güzel fiyatlar." : "burada.",
      description:
        maxDiscount > 0
          ? "Aklındaki parçaya bir adım daha yakınsın. Güncel indirimleri keşfet, favorini seç."
          : "Gardırobuna yeni bir hikâye ekle. Sana iyi gelen parçaları keşfet.",
      href: maxDiscount > 0 ? "/products?campaign=1" : "/products",
      action: maxDiscount > 0 ? "İndirimleri keşfet" : "Koleksiyonu keşfet",
      image: "/campaigns/street.webp",
      alt: "Bordo kaban ve alışveriş çantalarıyla şehir stili",
      theme: "sand",
      note: "Güncel fiyatlar ürün sayfalarındadır.",
      ...(maxDiscount > 0 ? { offer: "%" + maxDiscount + "'ye" } : {}),
    },
    {
      id: "edit",
      label: "Az parça, çok olasılık",
      title: "Her güne",
      emphasis: "biraz özen.",
      description:
        "Rahat kalıplar, sade detaylar. Günün nereye götürürse, stilin seninle gelsin.",
      href: "/products?featured=1",
      action: "Seçkiyi incele",
      image: "/campaigns/everyday.webp",
      alt: "Ceket ve rahat pantolonla sade şehir stili",
      theme: "wine",
      note: "Senin stilin. Senin hikâyen.",
    },
  ];
}
