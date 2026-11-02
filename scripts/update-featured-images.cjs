// Apply the requested demo cover refresh without replacing products or other images.
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const images = [
  ...require("../docs/featured-model-images.json").images,
  require("../docs/leather-sneaker-image.json"),
  ...require("../docs/trouser-model-images.json").images,
];
const url = new URL(process.env.DATABASE_URL);
const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: url.href, connectionTimeoutMillis: 5000, max: 1 },
    { schema: url.searchParams.get("schema") || "public" },
  ),
});
async function main() {
  for (const image of images) {
    if (!fs.existsSync(path.join(__dirname, "../public", image.url)))
      throw new Error("Missing local image asset: " + image.key);
  }
  const updated = await db.$transaction(async (tx) => {
    let count = 0;
    for (const image of images) {
      const product = await tx.product.findUnique({
        where: { id: image.productId },
        select: { slug: true },
      });
      const existing = await tx.productImage.findUnique({
        where: { id: image.imageId },
      });
      if (
        !product?.slug.startsWith("demo-") ||
        !existing ||
        existing.productId !== image.productId ||
        existing.sortOrder !== 0 ||
        ![image.oldUrl, image.url].includes(existing.url)
      )
        throw new Error(
          "Demo image changed or missing; refusing to overwrite: " + image.key,
        );
      if (existing.url === image.url && existing.alt === image.alt) continue;
      const result = await tx.productImage.updateMany({
        where: {
          id: image.imageId,
          url: existing.url,
          alt: existing.alt,
          productId: image.productId,
          sortOrder: 0,
        },
        data: { url: image.url, alt: image.alt },
      });
      if (result.count !== 1)
        throw new Error("Image changed during refresh: " + image.key);
      count++;
    }
    return count;
  });
  console.log(JSON.stringify({ updated, assets: images.map((i) => i.url) }));
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
