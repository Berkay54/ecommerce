import { expect, test, type Page } from "@playwright/test";
export async function loginExisting(page: Page, admin = false) {
  const email = admin ? process.env.E2E_ADMIN_EMAIL : process.env.E2E_EMAIL;
  const password = admin
    ? process.env.E2E_ADMIN_PASSWORD
    : process.env.E2E_PASSWORD;
  test.skip(
    !email || !password,
    "Mevcut gerçek hesap bilgileri yok; sahte kullanıcı oluşturulmaz.",
  );
  await page.goto(`/giris?next=${admin ? "/admin" : "/hesabim"}`);
  const form = page.locator("form.auth-form:visible");
  await form.getByLabel("E-posta", { exact: true }).fill(email!);
  await form.getByLabel("Şifre", { exact: true }).fill(password!);
  await form.getByRole("button", { name: "Giriş Yap", exact: true }).click();
  await expect(page).toHaveURL(admin ? /\/admin\/products/ : /\/hesabim$/);
  return email!;
}
