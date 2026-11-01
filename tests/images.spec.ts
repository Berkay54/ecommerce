import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { imageFileError, MAX_IMAGE_BYTES } from "../src/lib/images";
import { productImages } from "../src/lib/validation";
import { loginExisting } from "./auth-helpers";

test("image rules preserve URLs, ordering and alt text and reject unsafe input", () => {
  const images = [
    { url: "https://example.com/first.jpg", alt: "First" },
    { url: "http://example.com/second.jpg", alt: "Second" },
  ];
  expect(productImages(JSON.stringify(images))).toEqual(images);
  expect(() =>
    productImages(JSON.stringify([{ url: "javascript:alert(1)", alt: "" }])),
  ).toThrow();
  expect(() =>
    productImages(
      JSON.stringify([
        { url: "https://example.com/a\nhttps://example.com/b", alt: "" },
      ]),
    ),
  ).toThrow();
  expect(() =>
    productImages(JSON.stringify([{ ...images[0], alt: "a".repeat(301) }])),
  ).toThrow();
  expect(() =>
    productImages(JSON.stringify(Array.from({ length: 21 }, () => images[0]))),
  ).toThrow();
  expect(imageFileError({ type: "image/svg+xml", size: 100 })).toContain(
    "JPEG",
  );
  expect(
    imageFileError({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
  ).toContain("3 MB");
});

test("upload API checks origin, size and image contents", async ({ page }) => {
  await loginExisting(page, true);
  const request = page.request;
  const denied = await request.post("/api/admin/images", {
    headers: { origin: "https://another-site.example" },
  });
  expect(denied.status()).toBe(403);
  const invalid = await request.post("/api/admin/images", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not a PNG"),
      },
    },
  });
  expect(invalid.status()).toBe(400);
  const tooLarge = await request.post("/api/admin/images", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "large.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1),
      },
    },
  });
  expect(tooLarge.status()).toBe(413);
  const external = await request.delete("/api/admin/images", {
    headers: { origin: "http://localhost:3100" },
    data: { url: "https://example.com/image.jpg" },
  });
  expect(external.status()).toBe(400);
});

test("admin supports image previews, alt text, reordering and removing pending files", async ({
  page,
}, testInfo) => {
  await loginExisting(page, true);
  await page.goto("/admin/products/new");
  await expect(page.getByLabel("Görsel Seç")).toBeEnabled();
  const file = await sharp({
    create: { width: 80, height: 100, channels: 3, background: "#808a69" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("Görsel Seç").setInputFiles([
    { name: "one.png", mimeType: "image/png", buffer: file },
    { name: "two.png", mimeType: "image/png", buffer: file },
  ]);
  await expect(page.locator(".editor-image")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Ürünü Kaydet" }),
  ).toBeDisabled();
  await page.getByLabel("Alternatif Metin").nth(0).fill("First photograph");
  await page.getByLabel("Alternatif Metin").nth(1).fill("Second photograph");
  await page.getByRole("button", { name: "Görsel 2 öne taşı" }).click();
  await expect(page.getByLabel("Alternatif Metin").nth(0)).toHaveValue(
    "Second photograph",
  );
  await expect(page.locator(".editor-image").first()).toContainText(
    "Ana Görsel",
  );
  await page.screenshot({
    path: testInfo.outputPath("image-editor-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("image-editor-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Görsel 2 kaldır", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Görsel 1 kaldır", exact: true })
    .click();
  await expect(page.locator(".editor-image")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ürünü Kaydet" }),
  ).toBeEnabled();
});

test("missing Blob configuration reports a recoverable upload error", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    "A Blob token is present; this test only covers missing setup.",
  );
  await loginExisting(page, true);
  await page.goto("/admin/products/new");
  await expect(page.getByLabel("Görsel Seç")).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Ad", exact: true })
    .first()
    .fill("Unsaved form values");
  const file = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#808a69" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Görsel Seç")
    .setInputFiles({ name: "image.png", mimeType: "image/png", buffer: file });
  await page.getByRole("button", { name: "Seçilen Görselleri Yükle" }).click();
  await expect(page.locator(".image-editor [role='alert']")).toContainText(
    "Görsel depolama henüz yapılandırılmadı",
  );
  await expect(
    page.getByRole("textbox", { name: "Ad", exact: true }).first(),
  ).toHaveValue("Unsaved form values");
  await expect(
    page.getByRole("button", { name: "Seçilen Görselleri Yükle" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Ürünü Kaydet" }),
  ).toBeDisabled();
});
