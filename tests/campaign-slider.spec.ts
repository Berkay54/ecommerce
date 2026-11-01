import { expect, test } from "@playwright/test";

test("kampanya slaytları klavye, kontroller ve bağlantılarla çalışır", async ({
  page,
}) => {
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Sezon kampanyaları" });
  await expect(
    slider.getByRole("heading", { name: "Kendi ritmini yakala." }),
  ).toBeVisible();
  const next = slider.getByRole("button", { name: "Sonraki kampanya" });
  await next.click();
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /2 \/ 3/,
  );
  const cta = slider.locator(".campaign-slide.is-active .campaign-cta");
  await expect(cta).toHaveAttribute("href", /\/products/);
  await next.press("ArrowRight");
  await expect(
    slider.getByRole("heading", { name: "Her güne biraz özen." }),
  ).toBeVisible();
  await slider.getByRole("button", { name: "Önceki kampanya" }).click();
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /2 \/ 3/,
  );
  await slider
    .getByRole("button", { name: "Yeni sezon / Özen seçkisi slaydını göster" })
    .click();
  await expect(
    slider.getByRole("heading", { name: "Kendi ritmini yakala." }),
  ).toBeVisible();
  // Manual selection pauses rotation, including after focus leaves the stage.
  await page.getByRole("link", { name: "Özen ile keşfet" }).focus();
  await page.clock.install();
  await page.clock.fastForward(14000);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /1 \/ 3/,
  );
});

test("otomatik geçiş durdurulabilir ve yeniden oynatılabilir", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Sezon kampanyaları" });
  await expect(
    slider.getByRole("button", { name: "Slaytları durdur" }),
  ).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.runFor(100);
  await page.clock.fastForward(6700);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /2 \/ 3/,
  );
  await slider.getByRole("button", { name: "Slaytları durdur" }).click();
  await page.mouse.move(0, 0);
  await page.getByRole("link", { name: "Özen ile keşfet" }).focus();
  await page.clock.fastForward(14000);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /2 \/ 3/,
  );
  await slider.getByRole("button", { name: "Slaytları oynat" }).click();
  await page.getByRole("link", { name: "Özen ile keşfet" }).focus();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(6700);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /3 \/ 3/,
  );
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.clock.runFor(150);
  await expect(slider).not.toBeInViewport();
  await expect(slider.locator(".campaign-slides")).toHaveAttribute("aria-live", "polite");
  await page.clock.fastForward(14000);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /3 \/ 3/,
  );
});

test("hareket azaltma tercihinde otomatik geçiş kapanır; vitrin tüm ekranlara sığar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Sezon kampanyaları" });
  await expect(
    slider.getByRole("heading", { name: "Kendi ritmini yakala." }),
  ).toBeVisible();
  await expect(
    slider.getByRole("button", { name: "Slaytları durdur" }),
  ).toHaveCount(0);
  await page.clock.install();
  await page.clock.fastForward(14000);
  await expect(slider.locator(".campaign-slide.is-active")).toHaveAttribute(
    "aria-label",
    /1 \/ 3/,
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    for (let index = 0; index < 3; index++) {
      await expect
        .poll(() =>
          slider
            .locator(".campaign-slide.is-active img")
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
      await slider.screenshot({
        path: `test-results/campaign-${width}-${index}.png`,
      });
      await slider.getByRole("button", { name: "Sonraki kampanya" }).click();
    }
  }
});
