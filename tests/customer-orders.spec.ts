import { test, expect } from "@playwright/test";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { orderStatuses, statusTransitions } from "../src/lib/order-display";
import { loginExisting } from "./auth-helpers";
import { databaseRead, closeTestDatabase } from "./database-read";
test.afterAll(closeTestDatabase);

test("password hashing uses independent salts and never accepts plain text", async () => {
  const password = "a-strong-local-password-123";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  expect(first).not.toBe(second);
  expect(first).not.toContain(password);
  expect(await verifyPassword(password, first)).toBeTruthy();
  expect(await verifyPassword("wrong-password", first)).toBeFalsy();
  expect(await verifyPassword(password, password)).toBeFalsy();
  expect(await verifyPassword(password, null)).toBeFalsy();
});

test("order status labels and cancellation transitions are bounded", () => {
  expect(orderStatuses.PENDING).toBe("Sipariş Alındı");
  expect(statusTransitions.CANCELLED).toEqual([]);
  expect(statusTransitions.DELIVERED).toEqual([]);
  expect(statusTransitions.SHIPPED).not.toContain("CANCELLED");
  expect(statusTransitions.PENDING).toContain("CANCELLED");
});

test("guest access to accounts, checkout, orders and admin requires login", async ({
  page,
  request,
}) => {
  for (const path of [
    "/hesabim",
    "/hesabim/adresler",
    "/hesabim/siparisler",
    "/checkout",
    "/orders/not-an-order",
    "/admin",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/orders/not-an-order",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/giris\?/);
    await expect(
      page.getByRole("heading", { name: "Tekrar hoş geldiniz" }),
    ).toBeVisible();
    await expect(
      page
        .locator("form.auth-form:visible")
        .getByLabel("Şifre", { exact: true }),
    ).toBeVisible();
  }
  const upload = await request.post("/api/admin/images", {
    headers: { origin: "http://localhost:3100" },
  });
  expect(upload.status()).toBe(401);
  const deletion = await request.delete("/api/admin/images", {
    data: { url: "https://example.com/image.jpg" },
  });
  expect(deletion.status()).toBe(401);
  const session = await request.get("/api/auth/session");
  expect(await session.json()).toBeNull();
});

test("registration validation does not create a user and login rejects invalid credentials", async ({
  page,
}, testInfo) => {
  const usersBefore = await databaseRead((db) => db.user.count());
  const form = page.locator("form.auth-form:visible");
  await page.goto("/kayit?next=https://example.com");
  await expect(form.locator("input[name='next']")).toHaveValue("/hesabim");
  await form.getByLabel("Ad Soyad", { exact: true }).fill("Form Doğrulaması");
  await form
    .getByLabel("E-posta", { exact: true })
    .fill("validation@example.invalid");
  await form.getByLabel("Şifre", { exact: true }).fill("test-password-1234");
  await form
    .getByLabel("Şifre Tekrar", { exact: true })
    .fill("different-password-1234");
  await form.getByRole("button", { name: "Üye Ol", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Şifreler eşleşmiyor" }),
  ).toBeVisible();
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/giris");
    await expect(
      page.getByRole("heading", { name: "Tekrar hoş geldiniz" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`login-${width}.png`),
      fullPage: true,
    });
    await page.goto("/kayit");
    await expect(
      page.getByRole("heading", { name: "Aramıza katılın" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`register-${width}.png`),
      fullPage: true,
    });
  }
  await page.goto("/giris");
  await form
    .getByLabel("E-posta", { exact: true })
    .fill("unregistered@example.invalid");
  await form.getByLabel("Şifre", { exact: true }).fill("wrong-password-12345");
  await form.getByRole("button", { name: "Giriş Yap", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Giriş yapılamadı" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/giris$/);
  expect(await databaseRead((db) => db.user.count())).toBe(usersBefore);
  expect(await databaseRead((db) => db.authRateLimit.count())).toBeGreaterThan(
    0,
  );
});

test("existing real customer can log in, view account and sign out", async ({
  page,
}) => {
  const email = await loginExisting(page);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.goto("/hesabim/adresler");
  await expect(page.getByRole("heading", { name: "Adreslerim" })).toBeVisible();
  await page.goto("/hesabim/siparisler");
  await expect(
    page.getByRole("heading", { name: "Siparişlerim" }),
  ).toBeVisible();
  await page
    .locator(".account-navigation")
    .getByRole("button", { name: "Çıkış Yap" })
    .click();
  await expect(page).toHaveURL(/\/giris$/);
});

test("existing customer cannot read another order or enter admin", async ({
  page,
}) => {
  await loginExisting(page);
  const session = await (await page.request.get("/api/auth/session")).json();
  test.skip(
    session?.user?.role !== "USER",
    "Bu yetki testi gerçek USER hesabı gerektirir.",
  );
  for (const path of [
    "/admin/orders",
    "/admin/products",
    "/orders/SIP-NOT-OWNED",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Aradığınız sayfa bulunamadı" }),
    ).toBeVisible();
  }
  expect((await page.request.post("/api/admin/images")).status()).toBe(403);
});

test("existing real admin can view order management", async ({ page }) => {
  await loginExisting(page, true);
  await page.goto("/admin/orders");
  await expect(
    page.getByRole("heading", { name: "Siparişler", exact: true }),
  ).toBeVisible();
  const detail = page.getByRole("link", { name: "Detayları Gör" }).first();
  if (await detail.count()) {
    await detail.click();
    await expect(
      page.getByRole("heading", { name: "Sipariş Detayı" }),
    ).toBeVisible();
  }
});

test("sandbox initialization requires real account and product and preserves stock before payment", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_ALLOW_ORDER_CREATION !== "1" ||
      !process.env.IYZIPAY_API_KEY ||
      !process.env.IYZIPAY_SECRET_KEY ||
      !process.env.E2E_SANDBOX_IDENTITY_NUMBER,
    "Gerçek hesap/ürün, sandbox anahtarları, kullanıcı tarafından sağlanan kimlik bilgisi ve açık test izni gerekir.",
  );
  await loginExisting(page);
  await page.goto("/products");
  const product = page.locator(".product-image > a").first();
  test.skip(
    !(await product.count()),
    "Gerçek ürün yok; ürün gerektiren akış atlandı.",
  );
  await product.click();
  const available = await page
    .locator("#purchase-variant option:not([disabled])")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLOptionElement).value).find(Boolean),
    );
  test.skip(!available, "Satılabilir varyant yok.");
  const stockBefore = await databaseRead((db) =>
    db.productVariant.findUniqueOrThrow({
      where: { id: available! },
      select: { stock: true },
    }),
  );
  await page.getByLabel("Varyant Seçimi").selectOption(available!);
  await page.getByRole("button", { name: "Sepete Ekle", exact: true }).click();
  await expect(page.getByText("Ürün sepetinize eklendi.")).toBeVisible();
  await page.goto("/checkout");
  const addresses = page.locator(".checkout-address input");
  test.skip(
    !(await addresses.count()),
    "Gerçek teslimat adresi yok; örnek adres eklenmez.",
  );
  await addresses.first().check();
  await expect(
    page.getByText(
      "Güvenli ödeme iyzico altyapısı ile gerçekleştirilmektedir.",
    ),
  ).toBeVisible();
  await page
    .getByLabel("T.C. Kimlik Numarası")
    .fill(process.env.E2E_SANDBOX_IDENTITY_NUMBER!);
  await page.getByRole("button", { name: "Ödemeye Geç" }).click();
  await expect(page).toHaveURL(/^https:\/\/sandbox-cpp\.iyzipay\.com/);
  const stockAfter = await databaseRead((db) =>
    db.productVariant.findUniqueOrThrow({
      where: { id: available! },
      select: { stock: true },
    }),
  );
  expect(stockAfter.stock).toBe(stockBefore.stock);
});

test("address CRUD requires real supplied customer address details", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_ADDRESS_JSON,
    "Gerçek adres bilgileri verilmedi; örnek adres oluşturulmaz.",
  );
  await loginExisting(page);
  const details: unknown = JSON.parse(process.env.E2E_ADDRESS_JSON!);
  if (typeof details !== "object" || details === null)
    throw new Error("E2E_ADDRESS_JSON must be an address object.");
  const values = details as Record<string, unknown>;
  const labels: Record<string, string> = {
    title: "Adres Başlığı",
    fullName: "Ad Soyad",
    phone: "Telefon",
    city: "İl",
    district: "İlçe",
    addressLine: "Açık Adres",
    postalCode: "Posta Kodu",
  };
  await page.goto("/hesabim/adresler");
  test.skip(
    (await page
      .locator(".address-card")
      .filter({ hasText: String(values.title) })
      .count()) > 0,
    "Verilen adres başlığı zaten var; mevcut adres değiştirilmez.",
  );
  const form = page
    .locator("section.panel")
    .filter({ has: page.getByRole("heading", { name: "Yeni Adres Ekle" }) })
    .locator("form");
  for (const [key, label] of Object.entries(labels))
    await form
      .getByLabel(label, { exact: true })
      .fill(typeof values[key] === "string" ? values[key] : "");
  await form.getByRole("button", { name: "Adresi Kaydet" }).click();
  const card = page
    .locator(".address-card")
    .filter({ hasText: String(values.title) });
  await expect(card).toHaveCount(1);
  await card.getByText("Adresi Düzenle", { exact: true }).click();
  await card.getByRole("button", { name: "Adresi Kaydet" }).click();
  await expect(card.getByRole("status")).toContainText("Adres kaydedildi");
  await card.getByRole("button", { name: "Adresi Sil" }).click();
  await expect(card).toHaveCount(0);
});
