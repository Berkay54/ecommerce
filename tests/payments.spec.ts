import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  hostedPaymentUrl,
  paymentConfig,
  validatePaymentResult,
  verifySignature,
} from "../src/lib/payment-validation";
import { databaseRead, closeTestDatabase } from "./database-read";

test.afterAll(closeTestDatabase);

test("missing payment configuration fails closed without a fake API key", () => {
  expect(() => paymentConfig({})).toThrow("Sandbox ödeme ayarları eksik");
  expect(() => paymentConfig({ IYZIPAY_API_KEY: "" })).toThrow();
});

test("hosted checkout accepts only the exact HTTPS sandbox host", () => {
  expect(
    hostedPaymentUrl("https://sandbox-cpp.iyzipay.com/?token=opaque"),
  ).toContain("sandbox-cpp.iyzipay.com");
  for (const value of [
    "https://cpp.iyzipay.com",
    "http://sandbox-cpp.iyzipay.com",
    "https://sandbox-cpp.iyzipay.com.evil.example",
    "javascript:alert(1)",
    "https://user:pass@sandbox-cpp.iyzipay.com",
    "https://sandbox-cpp.iyzipay.com:444",
  ])
    expect(() => hostedPaymentUrl(value)).toThrow();
});

// Isolated cryptographic fixtures, not SDK credentials or database orders.
const signingMaterial = "isolated-hmac-test-vector";
function signed(overrides: Record<string, unknown> = {}) {
  const result: Record<string, unknown> = {
    status: "success",
    paymentStatus: "SUCCESS",
    paymentId: "123",
    currency: "TRY",
    basketId: "basket",
    conversationId: "conversation",
    price: "10.50",
    paidPrice: "10.50",
    token: "opaque-token",
    fraudStatus: 1,
    ...overrides,
  };
  const values = [
    result.paymentStatus,
    result.paymentId,
    result.currency,
    result.basketId,
    result.conversationId,
    new Prisma.Decimal(String(result.paidPrice)).toString(),
    new Prisma.Decimal(String(result.price)).toString(),
    result.token,
  ];
  result.signature = createHmac("sha256", signingMaterial)
    .update(values.join(":"))
    .digest("hex");
  return result;
}
const expected = {
  id: "conversation",
  orderId: "basket",
  token: "opaque-token",
  total: new Prisma.Decimal("10.50"),
};

test("retrieve validates signed amounts, currency, basket, conversation and token", () => {
  expect(validatePaymentResult(signed(), expected, signingMaterial)).toEqual({
    success: true,
    paymentId: "123",
    fraudApproved: true,
  });
  for (const change of [
    { currency: "USD" },
    { basketId: "other" },
    { conversationId: "other" },
    { token: "other" },
    { paidPrice: "11" },
    { price: "9" },
  ])
    expect(() =>
      validatePaymentResult(signed(change), expected, signingMaterial),
    ).toThrow();
  const tampered = { ...signed(), paidPrice: "11" };
  expect(() =>
    validatePaymentResult(tampered, expected, signingMaterial),
  ).toThrow();
  expect(() =>
    validatePaymentResult(
      { ...signed(), signature: undefined },
      expected,
      signingMaterial,
    ),
  ).toThrow();
  expect(() =>
    validatePaymentResult(
      { ...signed(), price: "NaN" },
      expected,
      signingMaterial,
    ),
  ).toThrow();
  expect(
    verifySignature([undefined], "0".repeat(64), signingMaterial),
  ).toBeFalsy();
});

test("signed decline and fraud review never authorize fulfillment", () => {
  expect(
    validatePaymentResult(
      signed({ paymentStatus: "FAILURE", paidPrice: "0", paymentId: "" }),
      expected,
      signingMaterial,
    ).success,
  ).toBeFalsy();
  expect(
    validatePaymentResult(
      signed({ paymentStatus: "FAILURE" }),
      expected,
      signingMaterial,
    ).success,
  ).toBeFalsy();
  expect(
    validatePaymentResult(signed({ fraudStatus: 0 }), expected, signingMaterial)
      .fraudApproved,
  ).toBeFalsy();
  expect(
    validatePaymentResult(
      signed({ fraudStatus: -1 }),
      expected,
      signingMaterial,
    ).fraudApproved,
  ).toBeFalsy();
  expect(() =>
    validatePaymentResult(
      signed({ paymentStatus: "PENDING" }),
      expected,
      signingMaterial,
    ),
  ).toThrow();
});

test("callback without setup returns a safe error and result pages protect ownership", async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    !!process.env.IYZIPAY_API_KEY && !!process.env.IYZIPAY_SECRET_KEY,
    "Ayarlar tanımlı; eksik ayar testi uygulanmaz.",
  );
  const result = await request.post("/api/payments/iyzico/callback", {
    form: { token: "invalid-token", status: "success", paidPrice: "0" },
    maxRedirects: 0,
  });
  expect(result.status()).toBe(503);
  expect(await result.json()).toEqual({
    error: "Sandbox ödeme ayarları eksik.",
  });
  await page.goto("/odeme/sonuc/not-an-attempt");
  await expect(page).toHaveURL(/\/giris\?/);
  await page.goto("/odeme/basarisiz");
  await expect(
    page.getByRole("heading", { name: "Ödeme Gerçekleştirilemedi" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sepete Dön" })).toBeVisible();
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`payment-failure-${width}.png`),
      fullPage: true,
    });
  }
});

test("real completed sandbox payment: callback and duplicate callback deduct stock only once", async ({
  request,
}) => {
  const token = process.env.E2E_SANDBOX_COMPLETED_PAYMENT_TOKEN;
  test.skip(
    !token ||
      !process.env.IYZIPAY_API_KEY ||
      process.env.E2E_ALLOW_ORDER_CREATION !== "1",
    "Gerçek tamamlanmış sandbox tokenı ve açık test izni yok; ödeme/sipariş uydurulmaz.",
  );
  const before = await databaseRead((db) =>
    db.paymentAttempt.findUnique({
      where: { token: token! },
      include: {
        order: { include: { items: { include: { variant: true } } } },
      },
    }),
  );
  test.skip(!before, "Token mevcut gerçek bir siparişe ait değil.");
  const first = await request.post("/api/payments/iyzico/callback", {
    form: { token: token! },
    maxRedirects: 0,
  });
  expect(first.status()).toBe(303);
  const after = await databaseRead((db) =>
    db.paymentAttempt.findUniqueOrThrow({
      where: { id: before!.id },
      include: {
        order: { include: { items: { include: { variant: true } } } },
      },
    }),
  );
  expect(after.status).toBe("SUCCEEDED");
  expect(after.order.status).toBe("PAID");
  expect(after.order.inventoryDeducted).toBeTruthy();
  for (const item of after.order.items) {
    const prior = before!.order.items.find((row) => row.id === item.id)!;
    expect(item.variant?.stock).toBe(
      prior.variant!.stock -
        (before!.status === "SUCCEEDED" ? 0 : item.quantity),
    );
  }
  const second = await request.post("/api/payments/iyzico/callback", {
    form: { token: token! },
    maxRedirects: 0,
  });
  expect(second.status()).toBe(303);
  const repeated = await databaseRead((db) =>
    db.paymentAttempt.findUniqueOrThrow({
      where: { id: before!.id },
      include: {
        order: { include: { items: { include: { variant: true } } } },
      },
    }),
  );
  expect(repeated.paymentId).toBe(after.paymentId);
  expect(repeated.order.items.map((item) => item.variant?.stock)).toEqual(
    after.order.items.map((item) => item.variant?.stock),
  );
});

test("real declined sandbox payment keeps order unpaid and preserves inventory", async ({
  request,
}) => {
  const token = process.env.E2E_SANDBOX_FAILED_PAYMENT_TOKEN;
  test.skip(
    !token ||
      !process.env.IYZIPAY_API_KEY ||
      process.env.E2E_ALLOW_ORDER_CREATION !== "1",
    "Gerçek başarısız sandbox tokenı ve açık test izni yok.",
  );
  const before = await databaseRead((db) =>
    db.paymentAttempt.findUniqueOrThrow({
      where: { token: token! },
      include: {
        order: { include: { items: { include: { variant: true } } } },
      },
    }),
  );
  await request.post("/api/payments/iyzico/callback", {
    form: { token: token! },
    maxRedirects: 0,
  });
  const after = await databaseRead((db) =>
    db.paymentAttempt.findUniqueOrThrow({
      where: { id: before.id },
      include: {
        order: { include: { items: { include: { variant: true } } } },
      },
    }),
  );
  expect(after.status).toBe("FAILED");
  expect(after.order.status).toBe("PENDING");
  expect(after.order.inventoryDeducted).toBeFalsy();
  expect(after.order.items.map((item) => item.variant?.stock)).toEqual(
    before.order.items.map((item) => item.variant?.stock),
  );
});
