import { test, expect, chromium } from "@playwright/test";
import {
  CART_STORAGE_KEY,
  cartKey,
  cartMoney,
  cents,
  parseCart,
} from "../src/lib/cart";

test("cart input validation merges combinations and rejects corrupt quantities", () => {
  const row = { productId: "id", variantId: "variant", quantity: 2 };
  expect(parseCart([row, row])).toEqual([{ ...row, quantity: 4 }]);
  expect(parseCart([row, { ...row, variantId: "another" }])).toHaveLength(2);
  expect(cartKey(row)).not.toBe(cartKey({ ...row, variantId: null }));
  for (const quantity of [0, -1, 1.5, "2", null, 2147483648])
    expect(() => parseCart([{ ...row, quantity }])).toThrow();
  expect(() => parseCart({})).toThrow();
  expect(() => parseCart(Array.from({ length: 101 }, () => row))).toThrow();
  expect(cents("12.05")).toBe(1205);
  expect(cents("0.1")).toBe(10);
  expect(cartMoney(1205 * 3)).toBe("₺36,15");
});

test("cart API rejects malformed rows and removes deleted products", async ({
  request,
}) => {
  const invalid = await request.post("/api/cart", {
    data: [{ productId: "missing", variantId: null, quantity: -1 }],
  });
  expect(invalid.status()).toBe(400);
  const response = await request.post("/api/cart", {
    data: [
      {
        productId: "nonexistent-product",
        variantId: "nonexistent-variant",
        quantity: 2,
      },
    ],
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body.lines).toEqual([]);
  expect(body.messages[0]).toContain("kaldırıldı");
});

test("empty bag, drawer keyboard focus, escape and mobile layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /Sepetim/ });
  await expect(trigger).toHaveAttribute("aria-label", "Sepetim, 0 ürün");
  await trigger.click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: "Sepetiniz henüz boş" }),
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Sepeti kapat", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath("cart-drawer-desktop.png"),
  });
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Sepetiniz henüz boş" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("cart-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: /Sepetim/ }).click();
  await expect(drawer).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("cart-drawer-mobile.png"),
  });
  expect(errors).toEqual([]);
});

test("saved stale items are reconciled and malformed storage can be cleared", async ({
  page,
}) => {
  await page.goto("/cart");
  await page.evaluate(
    ({ key }) =>
      localStorage.setItem(
        key,
        JSON.stringify([
          {
            productId: "deleted-product",
            variantId: "deleted-variant",
            quantity: 3,
          },
        ]),
      ),
    { key: CART_STORAGE_KEY },
  );
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "kaldırıldı" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), CART_STORAGE_KEY),
    )
    .toBe("[]");
  await page.evaluate(
    (key) => localStorage.setItem(key, "corrupt-json"),
    CART_STORAGE_KEY,
  );
  await page.reload();
  await expect(page.locator(".cart-contents [role='alert']")).toBeVisible();
  await page.getByRole("button", { name: "Kayıtlı Sepeti Temizle" }).click();
  await expect(page.locator(".cart-contents [role='alert']")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), CART_STORAGE_KEY),
    )
    .toBe("[]");
});

test("network failures preserve stored items and support retry", async ({
  page,
}) => {
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Sepetiniz henüz boş" }),
  ).toBeVisible();
  const saved = JSON.stringify([
    { productId: "deleted-product", variantId: "deleted-variant", quantity: 2 },
  ]);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: CART_STORAGE_KEY,
    value: saved,
  });
  await page.route("**/api/cart", (route) => route.abort());
  await page.reload();
  await expect(page.locator(".cart-contents [role='alert']")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), CART_STORAGE_KEY),
  ).toBe(saved);
  await page.unroute("**/api/cart");
  await page.getByRole("button", { name: "Tekrar Dene" }).click();
  await expect(page.locator(".cart-contents [role='alert']")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), CART_STORAGE_KEY),
    )
    .toBe("[]");
});

test("real product: variants, merging, stock limits, persistence across browser restarts, remove and clear", async ({}, testInfo) => {
  const profile = testInfo.outputPath("guest-profile");
  let context = await chromium.launchPersistentContext(profile, {
    headless: true,
    baseURL: "http://localhost:3100",
  });
  try {
    let page = await context.newPage();
    await page.goto(
      process.env.E2E_PRODUCT_SLUG
        ? `/products/${process.env.E2E_PRODUCT_SLUG}`
        : "/products",
    );
    if (!process.env.E2E_PRODUCT_SLUG) {
      const product = page.locator(".product-image > a").first();
      test.skip(
        !(await product.count()),
        "No real products exist. This test never seeds mock inventory.",
      );
      await product.click();
    }
    const add = page.getByRole("button", { name: "Sepete Ekle", exact: true });
    await expect(add).toBeDisabled();
    const options = page.locator("#purchase-variant option:not([disabled])");
    const selected = await options.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLOptionElement).value).find(Boolean),
    );
    test.skip(!selected, "The real product has no available stock.");
    await page.getByLabel("Varyant Seçimi").selectOption(selected!);
    await expect(add).toBeEnabled();
    await add.click();
    await expect(page.getByText("Ürün sepetinize eklendi.")).toBeVisible();
    const saved = parseCart(
      JSON.parse(
        (await page.evaluate(
          (key) => localStorage.getItem(key),
          CART_STORAGE_KEY,
        ))!,
      ),
    );
    const response = await page.request.post("/api/cart", { data: saved });
    const current = (await response.json()).lines[0];
    if (current.stock > 1) {
      await add.click();
      await expect(page.getByRole("button", { name: /Sepetim/ })).toContainText(
        "(2)",
      );
    }
    await page.goto("/cart");
    await expect(page.locator(".cart-line")).toHaveCount(1);
    const quantity = page.locator(".quantity-control input");
    await quantity.fill(String(current.stock + 1));
    await quantity.blur();
    await expect(quantity).toHaveValue(String(current.stock));
    await expect(
      page.getByRole("button", { name: /adedini artır/ }),
    ).toBeDisabled();
    const overStock = await page.request.post("/api/cart", {
      data: [
        { ...saved[0], quantity: Math.min(2147483647, current.stock + 1) },
      ],
    });
    expect((await overStock.json()).lines[0].quantity).toBe(current.stock);
    const invalidVariant = await page.request.post("/api/cart", {
      data: [{ ...saved[0], variantId: "deleted-variant" }],
    });
    expect((await invalidVariant.json()).lines).toEqual([]);
    await page.reload();
    await expect(page.locator(".quantity-control input")).toHaveValue(
      String(current.stock),
    );
    await page.screenshot({
      path: testInfo.outputPath("cart-populated.png"),
      fullPage: true,
    });
    await context.close();
    context = await chromium.launchPersistentContext(profile, {
      headless: true,
      baseURL: "http://localhost:3100",
    });
    page = await context.newPage();
    await page.goto("/cart");
    await expect(page.locator(".cart-line")).toHaveCount(1);
    await expect(page.locator(".quantity-control input")).toHaveValue(
      String(current.stock),
    );
    await page.getByRole("button", { name: /ürününü sil/ }).click();
    await expect(
      page.getByRole("heading", { name: "Sepetiniz henüz boş" }),
    ).toBeVisible();
    await page.evaluate(
      ({ key, rows }) => localStorage.setItem(key, JSON.stringify(rows)),
      { key: CART_STORAGE_KEY, rows: saved },
    );
    await page.reload();
    await expect(page.locator(".cart-line")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Sepeti Temizle", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Sepetiniz henüz boş" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
