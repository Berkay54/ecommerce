// Demo catalog only. Does not create users/orders or reset inventory.
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
const { PrismaClient, Prisma } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const sharp = require("sharp");

const categories = [
  { slug: "tisort", name: "Tişört" },
  { slug: "sweatshirt", name: "Sweatshirt" },
  { slug: "ayakkabi", name: "Ayakkabı" },
  { slug: "pantolon", name: "Pantolon" },
  { slug: "ceket", name: "Ceket" },
];
// Public, representative photos. Never claim that these are the actual demo goods.
const photos = {
  tisort: [
    "photo-1521572163474-6864f9cf17ab",
    "photo-1583743814966-8936f5b7be1a",
  ],
  sweatshirt: [
    "photo-1556821840-3a63f95609a7",
    "photo-1620799140408-edc6dcb6d633",
  ],
  ayakkabi: ["photo-1542291026-7eec264c27ff", "photo-1549298916-b41d501d3772"],
  pantolon: [
    "photo-1542272604-787c3835535d",
    "photo-1473966968600-fa801b869a1a",
  ],
  ceket: ["photo-1551028719-00167b16eac5", "photo-1544022613-e87ca75a784a"],
};
const clothes = ["S", "M", "L", "XL"];
const shoes = ["40", "41", "42", "43", "44"];
const trousers = ["30", "32", "34", "36"];
const catalog = [
  {
    slug: "demo-oversize-basic-tisort",
    name: "Oversize Basic Tişört",
    category: "tisort",
    price: "799.00",
    comparePrice: "999.00",
    featured: true,
    sku: "DEMO-TSH-OVR-BLK",
    sizes: clothes,
    stocks: [12, 18, 15, 8],
    description:
      "Yüksek gramajlı pamuk kumaşı ve rahat kalıbıyla günlük kullanıma uygun oversize tişört. Bisiklet yaka ve düşük omuz kesimiyle sade kombinleri tamamlar.",
  },
  {
    slug: "demo-premium-pamuk-tisort",
    name: "Premium Pamuk Tişört",
    category: "tisort",
    price: "899.00",
    comparePrice: "1099.00",
    featured: true,
    sku: "DEMO-TSH-PRM-WHT",
    sizes: clothes,
    stocks: [10, 16, 14, 6],
    description:
      "Yumuşak dokulu pamuk kumaşı ve dengeli regular kesimiyle gün boyu konfor sunan tişört. Düz paça pantolon ve sneaker modelleriyle kolayca kombinlenir.",
  },
  {
    slug: "demo-minimal-logo-tisort",
    name: "Minimal Logo Tişört",
    category: "tisort",
    price: "749.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-TSH-LOG-NVY",
    sizes: clothes,
    stocks: [9, 12, 8, 0],
    description:
      "Göğüs bölümündeki küçük logo detayıyla öne çıkan bisiklet yaka tişört. Hafif pamuk dokusu ve rahat kesimi günlük şehir stiline uyum sağlar.",
  },
  {
    slug: "demo-heavyweight-oversize-sweatshirt",
    name: "Heavyweight Oversize Sweatshirt",
    category: "sweatshirt",
    price: "1599.00",
    comparePrice: "1899.00",
    featured: true,
    sku: "DEMO-SWT-HVY-GRY",
    sizes: clothes,
    stocks: [8, 14, 12, 5],
    description:
      "Kalın dokulu kumaşı, düşük omuzları ve geniş kesimiyle serin günler için tasarlanan sweatshirt. Ribanalı manşet ve etek ucu formunu korumaya yardımcı olur.",
  },
  {
    slug: "demo-kapusonlu-basic-sweatshirt",
    name: "Kapüşonlu Basic Sweatshirt",
    category: "sweatshirt",
    price: "1499.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-SWT-HOD-BLK",
    sizes: clothes,
    stocks: [10, 15, 11, 7],
    description:
      "Ayarlanabilir kapüşonu ve kanguru cebiyle pratik kullanım sunan basic sweatshirt. Yumuşak iç yüzeyi ve rahat kalıbı katmanlı giyim için uygundur.",
  },
  {
    slug: "demo-zip-up-sweatshirt",
    name: "Zip-Up Sweatshirt",
    category: "sweatshirt",
    price: "1799.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-SWT-ZIP-STN",
    sizes: clothes,
    stocks: [6, 10, 9, 4],
    description:
      "Tam boy fermuarı ve iki yan cebiyle mevsim geçişlerinde kolay kullanım sağlayan sweatshirt. Tişört üzerine açık ya da kapalı olarak giyilebilir.",
  },
  {
    slug: "demo-urban-runner-sneaker",
    name: "Urban Runner Sneaker",
    category: "ayakkabi",
    price: "2799.00",
    comparePrice: "3299.00",
    featured: true,
    sku: "DEMO-SHO-URB-WHT",
    sizes: shoes,
    stocks: [6, 10, 12, 9, 5],
    description:
      "Hafif tabanı ve destekli bilek çevresiyle günlük şehir yürüyüşlerine uygun sneaker. Tekstil ve sentetik yüzeylerin birleşimi sportif bir görünüm sunar.",
  },
  {
    slug: "demo-retro-court-sneaker",
    name: "Retro Court Sneaker",
    category: "ayakkabi",
    price: "2499.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-SHO-CRT-CRM",
    sizes: shoes,
    stocks: [5, 8, 10, 7, 4],
    description:
      "Klasik kort modellerinden ilham alan alçak bilekli sneaker. Düz tabanı, sade panelleri ve yumuşak iç astarıyla günlük kombinleri tamamlar.",
  },
  {
    slug: "demo-minimal-leather-sneaker",
    name: "Minimal Leather Sneaker",
    category: "ayakkabi",
    price: "3299.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-SHO-LTH-WHT",
    sizes: shoes,
    stocks: [4, 7, 9, 6, 3],
    description:
      "Deri görünümlü yüzeyi, temiz hatları ve tonal bağcıklarıyla sade stile uygun sneaker. Günlük kullanımdan ofis kombinlerine uzanan zamansız bir modeldir.",
  },
  {
    slug: "demo-relaxed-fit-pantolon",
    name: "Relaxed Fit Pantolon",
    category: "pantolon",
    price: "1699.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-PNT-RLX-STN",
    sizes: trousers,
    stocks: [7, 12, 10, 6],
    description:
      "Rahat bel oturuşu ve genişleyen düz paçasıyla hareket özgürlüğü sunan pantolon. Pamuk ağırlıklı dokusu ve yan cepleri günlük kullanıma uygundur.",
  },
  {
    slug: "demo-straight-fit-denim",
    name: "Straight Fit Denim",
    category: "pantolon",
    price: "1899.00",
    comparePrice: null,
    featured: false,
    sku: "DEMO-PNT-DNM-BLU",
    sizes: trousers,
    stocks: [6, 11, 9, 5],
    description:
      "Orta bel yüksekliği ve düz paça kesimiyle klasik bir görünüm sunan denim pantolon. Beş cepli yapısı ve hafif yıkama detaylarıyla sezonlar boyunca kullanılabilir.",
  },
  {
    slug: "demo-utility-bomber-ceket",
    name: "Utility Bomber Ceket",
    category: "ceket",
    price: "3499.00",
    comparePrice: "3999.00",
    featured: true,
    sku: "DEMO-JKT-BMB-OLV",
    sizes: clothes,
    stocks: [5, 8, 7, 4],
    description:
      "Fermuarlı önü, işlevsel cepleri ve ribanalı manşetleriyle mevsim geçişlerine uygun bomber ceket. Rahat kalıbı tişört ve sweatshirt üzerine kolayca giyilir.",
  },
];

async function verifiedPhotos() {
  const result = {};
  for (const [category, ids] of Object.entries(photos)) {
    result[category] = [];
    for (const id of ids) {
      const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/")
        )
          throw new Error();
        const bytes = Buffer.from(await response.arrayBuffer());
        const metadata = await sharp(bytes).metadata();
        if (!metadata.width || !metadata.height) throw new Error();
        result[category].push(url);
      } catch {
        console.warn(
          `${category}: bir temsili görsel erişilemedi; bu URL eklenmeyecek.`,
        );
      }
    }
  }
  return result;
}

function validateCatalog() {
  const slugs = new Set();
  const skus = new Set();
  for (const product of catalog) {
    if (!product.slug.startsWith("demo-") || slugs.has(product.slug))
      throw new Error("Demo slug tekrarı veya geçersiz slug.");
    slugs.add(product.slug);
    if (
      !categories.some((category) => category.slug === product.category) ||
      product.sizes.length !== product.stocks.length
    )
      throw new Error("Demo kategori veya varyant verisi geçersiz.");
    if (
      new Prisma.Decimal(product.price).lte(0) ||
      (product.comparePrice &&
        new Prisma.Decimal(product.comparePrice).lte(product.price))
    )
      throw new Error("Demo fiyat verisi geçersiz.");
    product.sizes.forEach((size, i) => {
      const sku = `${product.sku}-${size}`;
      if (
        skus.has(sku) ||
        !Number.isSafeInteger(product.stocks[i]) ||
        product.stocks[i] < 0
      )
        throw new Error("Demo SKU veya stok verisi geçersiz.");
      skus.add(sku);
    });
  }
}

async function seed(db, images) {
  return db.$transaction(
    async (tx) => {
      const existingProducts = await tx.product.findMany({
        where: { slug: { in: catalog.map((product) => product.slug) } },
        select: { id: true, slug: true },
      });
      const existingCategories = await tx.category.findMany({
        where: { slug: { in: categories.map((category) => category.slug) } },
        select: { slug: true },
      });
      const expectedSkus = catalog.flatMap((product) =>
        product.sizes.map((size) => ({
          sku: `${product.sku}-${size}`,
          productId: `seed-${product.slug}`,
        })),
      );
      const existingVariants = await tx.productVariant.findMany({
        where: { sku: { in: expectedSkus.map((item) => item.sku) } },
        select: { sku: true, productId: true },
      });
      // A coincidentally matching real slug/SKU must never be overwritten or adopted.
      if (
        existingProducts.some(
          (product) => product.id !== `seed-${product.slug}`,
        ) ||
        existingVariants.some(
          (variant) =>
            expectedSkus.find((item) => item.sku === variant.sku)?.productId !==
            variant.productId,
        )
      )
        throw new Error(
          "Demo slug/SKU mevcut farklı bir ürüne ait. Hiçbir değişiklik uygulanmadı.",
        );
      const categoryIds = new Map();
      for (const category of categories) {
        const row = await tx.category.upsert({
          where: { slug: category.slug },
          update: {},
          create: category,
        });
        categoryIds.set(category.slug, row.id);
      }
      let createdVariants = 0;
      let createdImages = 0;
      for (const product of catalog) {
        const productImages = images[product.category].map((url, i) => ({
          id: `seed-image-${product.slug}-${i + 1}`,
          url,
          sortOrder: i,
          alt: `${product.name} — temsili TEST / DEMO görseli ${i + 1}`,
        }));
        await tx.product.upsert({
          where: { slug: product.slug },
          // Re-runs preserve admin edits, sold stock, images and existing variant IDs.
          update: {},
          create: {
            id: `seed-${product.slug}`,
            slug: product.slug,
            name: product.name,
            description: `${product.description}\n\nTEST / DEMO ÜRÜNÜ: Yalnızca mağaza, sepet ve sandbox ödeme testleri içindir. Görseller temsilidir; gerçek satış veya teslimat yapılmaz.`,
            price: new Prisma.Decimal(product.price),
            comparePrice: product.comparePrice
              ? new Prisma.Decimal(product.comparePrice)
              : null,
            active: true,
            featured: product.featured,
            categoryId: categoryIds.get(product.category),
            variants: {
              create: product.sizes.map((size, i) => ({
                id: `seed-variant-${product.sku}-${String(i + 1).padStart(2, "0")}-${size}`,
                sku: `${product.sku}-${size}`,
                name: size,
                stock: product.stocks[i],
              })),
            },
            images: { create: productImages },
          },
        });
        if (!existingProducts.some((row) => row.slug === product.slug)) {
          createdVariants += product.sizes.length;
          createdImages += productImages.length;
        }
      }
      return {
        createdCategories: categories.length - existingCategories.length,
        createdProducts: catalog.length - existingProducts.length,
        createdVariants,
        createdImages,
        demoProducts: catalog.length,
      };
    },
    { isolationLevel: "Serializable", maxWait: 10000, timeout: 90000 },
  );
}

async function main() {
  validateCatalog();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL tanımlı değil.");
  const url = new URL(process.env.DATABASE_URL);
  const images = await verifiedPhotos();
  const db = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url.href, connectionTimeoutMillis: 10000, max: 1 },
      { schema: url.searchParams.get("schema") ?? "public" },
    ),
  });
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        console.log("TEST / DEMO katalog seed sonucu:");
        console.log(JSON.stringify(await seed(db, images), null, 2));
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ["P2034", "P2002"].includes(error.code) &&
          attempt < 2
        )
          continue;
        throw error;
      }
    }
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  // Avoid logging connection URLs, credentials or adapter exception payloads.
  console.error(
    error instanceof Prisma.PrismaClientKnownRequestError
      ? `Seed tamamlanamadı (${error.code}).`
      : error instanceof Error && /^(Demo|DATABASE_URL)/.test(error.message)
        ? error.message
        : "Seed tamamlanamadı. Veritabanı bağlantısını ve migration durumunu kontrol edin.",
  );
  process.exitCode = 1;
});
