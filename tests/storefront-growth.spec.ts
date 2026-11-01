import { expect, test } from "@playwright/test";
import { databaseRead, closeTestDatabase } from "./database-read";
import { campaignValues } from "../src/lib/campaign-validation";
import { shipmentValues, returnTransitions } from "../src/lib/fulfillment";
import { jsonLd } from "../src/lib/site";
test.afterAll(closeTestDatabase);

test("kampanya bağlantıları ve kargo alanları sunucuda doğrulanır", () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    label: "Seçki",
    title: "Yeni sezon",
    emphasis: "Keşfet",
    description: "Güncel ürünler",
    href: "/products?featured=1",
    action: "İncele",
    image: "/campaigns/editorial.webp",
    alt: "Moda çekimi",
    theme: "forest",
    note: "",
    sortOrder: "1",
  }))
    data.set(key, value);
  expect(campaignValues(data).href).toBe("/products?featured=1");
  for (const href of [
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "javascript:alert(1)",
    "/admin",
    "/products/../admin",
  ]) {
    data.set("href", href);
    expect(() => campaignValues(data)).toThrow();
  }
  data.set("href", "/products");
  data.set("image", "http://example.com/image.jpg");
  expect(() => campaignValues(data)).toThrow();
  const shipment = new FormData();
  shipment.set("shippingCarrier", "Yurtiçi Kargo");
  shipment.set("trackingNumber", "123ABC456");
  expect(shipmentValues(shipment).trackingNumber).toBe("123ABC456");
  shipment.set("trackingNumber", "https://evil.invalid");
  expect(() => shipmentValues(shipment)).toThrow();
  expect(returnTransitions.REJECTED).toEqual([]);
  expect(returnTransitions.CLOSED).toEqual([]);
  expect(returnTransitions.REQUESTED).not.toContain("CLOSED");
  expect(jsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain(
    "<",
  );
});

test("yeni yönetim sayfaları ve bildirim uç noktası misafire kapalıdır", async ({
  page,
  request,
}) => {
  for (const path of [
    "/admin/campaigns",
    "/admin/campaigns/new",
    "/admin/campaigns/unknown",
    "/admin/reviews",
    "/admin/returns",
    "/admin/notifications",
    "/admin/readiness",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/giris\?/);
  }
  expect((await request.get("/api/cron/notifications")).status()).toBe(401);
  expect(
    (
      await request.get("/api/cron/notifications", {
        headers: { authorization: "Bearer invalid" },
      })
    ).status(),
  ).toBe(401);
});

test("arama önerileri gerçek aktif ürünleri döndürür ve klavyeyle açılır", async ({
  page,
  request,
}) => {
  const product = await databaseRead((db) =>
    db.product.findFirst({ where: { active: true }, orderBy: { name: "asc" } }),
  );
  test.skip(!product, "Aktif ürün yok.");
  expect(await (await request.get("/api/search?q=a")).json()).toEqual({
    products: [],
    categories: [],
  });
  const response = await request.get(
    `/api/search?q=${encodeURIComponent(product!.name)}`,
  );
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(
    body.products.some((p: { id: string }) => p.id === product!.id),
  ).toBeTruthy();
  expect(body.products[0]).not.toHaveProperty("variants");
  await page.goto("/");
  const input = page.getByRole("combobox", {
    name: "Ürün, kategori veya marka ara",
  });
  await input.fill(product!.name);
  await expect(
    page.getByRole("option").filter({ hasText: product!.name }),
  ).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await input.focus();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/products/${product!.slug}$`));
  await expect(page.locator(".detail-copy h1:visible")).toHaveText(
    product!.name,
  );
  await expect(page).toHaveTitle(new RegExp(product!.name));
});

test("görsel büyütme, beden rehberi ve mobil satın alma birlikte çalışır", async ({
  page,
}) => {
  const product = await databaseRead((db) =>
    db.product.findFirst({
      where: {
        active: true,
        images: { some: {} },
        variants: { some: { stock: { gt: 0 } } },
      },
      include: { variants: { where: { stock: { gt: 0 } } }, images: true },
    }),
  );
  test.skip(!product, "Görselli ve stokta ürün yok.");
  await page.goto(`/products/${product!.slug}`);
  await page.getByRole("button", { name: "Görseli büyüt" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Yakınlaştır", exact: true })
    .click();
  await expect(dialog.locator("img")).toHaveClass("zoomed");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Beden ve ölçü rehberi" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("santimetre tablosu henüz paylaşılmadı");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 375, height: 812 });
  const bar = page.getByLabel("Hızlı satın alma");
  await expect(bar).toBeVisible();
  await bar.getByRole("button", { name: "Varyant Seç" }).click();
  const variant = page.locator("select#purchase-variant:visible");
  await expect(variant).toBeFocused();
  await variant.selectOption(product!.variants[0].id);
  await bar.getByRole("button", { name: "Sepete Ekle", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sepetim, 1 ürün" }),
  ).toBeVisible();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/product-enhanced-${width}.png`,
      fullPage: true,
    });
  }
});

test("öneri servisi hata verirse normal arama çalışmaya devam eder", async ({
  page,
}) => {
  await page.route("**/api/search?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "unavailable" }),
    }),
  );
  await page.goto("/");
  const search = page.getByRole("combobox", {
    name: "Ürün, kategori veya marka ara",
  });
  await search.fill("eşleşmeyen 123456");
  await expect(
    page.getByRole("status").filter({ hasText: "Öneriler yüklenemedi" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page).toHaveURL(/\/products\?q=/);
  await expect(
    page.getByText("Aradığınız kriterlere uygun ürün bulunamadı."),
  ).toBeVisible();
});

test("yorumlar yalnızca onaylı kayıtları gösterir ve misafir yazamaz", async ({
  page,
}) => {
  const product = await databaseRead((db) =>
    db.product.findFirst({
      where: { active: true },
      include: { reviews: { where: { approved: true } } },
    }),
  );
  test.skip(!product, "Aktif ürün yok.");
  await page.goto(`/products/${product!.slug}`);
  const section = page.locator(".product-reviews:visible");
  await expect(
    section.getByRole("heading", { name: "Müşteri Değerlendirmeleri" }),
  ).toBeVisible();
  await expect(section.locator("form")).toHaveCount(0);
  expect(await section.locator("article").count()).toBe(
    Math.min(30, product!.reviews.length),
  );
});

test("demo ve özel sayfalar indekslenmez", async ({ page, request }) => {
  const product = await databaseRead((db) =>
    db.product.findFirst({
      where: { active: true, slug: { startsWith: "demo-" } },
    }),
  );
  test.skip(!product, "Demo ürün yok.");
  await page.goto(`/products/${product!.slug}`);
  await expect(page.locator('meta[name="robots"]').last()).toHaveAttribute(
    "content",
    /noindex/,
  );
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/(admin)?/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("demo-");
});
