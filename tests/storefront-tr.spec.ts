import { test, expect } from "@playwright/test";
import { money } from "../src/lib/catalog";
import { cartMoney } from "../src/lib/cart";
import { slug } from "../src/lib/validation";

test("Turkish currency and generated slugs", () => {
  expect(money("1299.9")).toBe("₺1.299,90");
  expect(cartMoney(129990)).toBe("₺1.299,90");
  expect(slug("Çıra Işık Ürünü")).toBe("cira-isik-urunu");
});

test("storefront and admin stay within mobile, tablet and desktop viewports", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "/",
      "/products",
      "/cart",
      "/admin",
      "/admin/products/new",
    ]) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "tr");
      const heading =
        route === "/"
          ? /Şehir soğur/
          : route.startsWith("/admin")
            ? "Tekrar hoş geldiniz"
            : route === "/cart"
              ? "Sepetim"
              : route === "/admin/products/new"
                ? "Yeni Ürün"
                : "Ürünler";
      await expect(page.locator("main h1").first()).toHaveText(heading);
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: "Ürünler yükleniyor…" }),
      ).toBeHidden();
      await expect(
        page.getByRole("heading", { name: "Sayfa yüklenemedi" }),
      ).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} at ${width}px`,
      ).toBeTruthy();
      await page.screenshot({
        path: testInfo.outputPath(
          `${route.replaceAll("/", "-") || "home"}-${width}.png`,
        ),
        fullPage: true,
      });
    }
    await page.goto("/cart");
    await page.getByRole("button", { name: /^Sepetim,/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath(`drawer-${width}.png`) });
    await page.keyboard.press("Escape");
  }
  expect(errors).toEqual([]);
});

test("search, sort, category navigation and mobile filters use real routes", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Ürün, kategori veya marka ara" })
    .fill("eşleşmeyen arama 987654321");
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page).toHaveURL(/\/products\?q=/);
  await expect(
    page.getByText("Aradığınız kriterlere uygun ürün bulunamadı."),
  ).toBeVisible();
  await page.getByLabel("Sırala", { exact: true }).selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page).toHaveURL(/q=/);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Filtrele", exact: true }).click();
  const filter = page.getByRole("dialog");
  await expect(filter).toBeVisible();
  await filter.getByLabel("En az (TL)", { exact: true }).fill("10");
  await filter.getByLabel("En çok (TL)", { exact: true }).fill("500");
  await filter.getByLabel("Yalnızca stoktakiler").check();
  await filter.getByRole("button", { name: "Filtreleri Uygula" }).click();
  await expect(page).toHaveURL(/min=10/);
  await expect(page).toHaveURL(/max=500/);
  await expect(page).toHaveURL(/stock=1/);
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  const menu = page.getByRole("navigation", { name: "Mobil menü" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Favorilerim", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Favorilerim", exact: true }),
  ).toBeVisible();
  await page.goto("/kategoriler");
  await expect(
    page.getByRole("heading", { name: "Kategorileri Keşfet" }),
  ).toBeVisible();
});

test("unavailable services are honest and footer links resolve", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".account-menu > summary").click();
  await expect(
    page
      .locator(".account-menu")
      .getByRole("link", { name: "Giriş Yap", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Kaydol" })).toBeDisabled();
  for (const slug of [
    "hakkimizda",
    "iletisim",
    "magazalar",
    "sss",
    "kargo",
    "iade",
    "gizlilik",
    "kvkk",
    "satis-sozlesmesi",
    "cerezler",
  ]) {
    const response = await page.goto(`/bilgi/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
  }
});

test("real product detail, gallery and local favorites", async ({
  page,
}, testInfo) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-title:visible h1")).toBeVisible();
  const product = page.locator(".product-image > a").first();
  test.skip(
    !(await product.count()),
    "Gerçek ürün bulunmuyor; örnek ürün oluşturulmaz.",
  );
  const card = page.locator(".product-card").first();
  await card.getByRole("button", { name: "Favorilere Ekle" }).click();
  await expect(
    card.getByRole("button", { name: "Favorilerden Çıkar" }),
  ).toHaveAttribute("aria-pressed", "true");
  await product.click();
  await expect(
    page.getByRole("button", { name: "Sepete Ekle", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Varyant Seçimi")).toBeVisible();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`detail-${width}.png`),
      fullPage: true,
    });
  }
  const thumbnails = page.locator(".gallery-thumbnails button");
  if ((await thumbnails.count()) > 1) {
    await thumbnails.nth(1).click();
    await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole("link", { name: "Favorilerim", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
});
