import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";

export class PaymentConfigurationError extends Error {}
export function paymentConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (!env.IYZIPAY_API_KEY?.trim() || !env.IYZIPAY_SECRET_KEY?.trim())
    throw new PaymentConfigurationError(
      "Sandbox ödeme ayarları eksik. Mağaza yöneticisi iyzico sandbox anahtarlarını tanımlamalıdır.",
    );
  const uri = env.IYZIPAY_URI?.replace(/\/$/, "");
  if (uri !== "https://sandbox-api.iyzipay.com")
    throw new PaymentConfigurationError(
      "Yalnızca iyzico sandbox adresine izin verilir.",
    );
  let app: URL;
  try {
    app = new URL(env.NEXT_PUBLIC_APP_URL ?? "");
  } catch {
    throw new PaymentConfigurationError("Uygulama adresi yapılandırılmamış.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname);
  if (
    app.username ||
    app.password ||
    app.search ||
    app.hash ||
    app.pathname !== "/" ||
    (app.protocol !== "https:" && !(local && app.protocol === "http:"))
  )
    throw new PaymentConfigurationError(
      "Uygulama adresi geçersiz; yerel geliştirme dışında HTTPS gerekir.",
    );
  return {
    uri,
    apiKey: env.IYZIPAY_API_KEY.trim(),
    secretKey: env.IYZIPAY_SECRET_KEY.trim(),
    appUrl: app.origin,
  };
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Geçersiz iyzico yanıtı.");
  return value as Record<string, unknown>;
}
export function textField(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function amount(value: unknown) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+(\.\d{1,8})?$/.test(String(value))
  )
    throw new Error("Geçersiz ödeme tutarı.");
  return new Prisma.Decimal(value);
}
export function verifySignature(
  values: unknown[],
  signature: unknown,
  secret: string,
) {
  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    values.some((v) => typeof v !== "string" && typeof v !== "number")
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(values.join(":"))
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function hostedPaymentUrl(value: unknown) {
  const url = new URL(textField(value));
  if (
    url.protocol !== "https:" ||
    url.hostname !== "sandbox-cpp.iyzipay.com" ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error("Geçersiz sandbox ödeme adresi.");
  return url.href;
}
export function validatePaymentResult(
  result: Record<string, unknown>,
  expected: {
    id: string;
    orderId: string;
    token: string;
    total: Prisma.Decimal;
  },
  secret: string,
) {
  const price = amount(result.price);
  const paidPrice = amount(result.paidPrice);
  if (
    !verifySignature(
      [
        result.paymentStatus,
        result.paymentId,
        result.currency,
        result.basketId,
        result.conversationId,
        paidPrice.toString(),
        price.toString(),
        result.token,
      ],
      result.signature,
      secret,
    )
  )
    throw new Error("Ödeme imzası doğrulanamadı.");
  if (
    result.token !== expected.token ||
    result.conversationId !== expected.id ||
    result.basketId !== expected.orderId ||
    result.currency !== "TRY" ||
    !price.equals(expected.total)
  )
    throw new Error("Ödeme ile sipariş eşleşmiyor.");
  if (result.paymentStatus !== "SUCCESS" && result.paymentStatus !== "FAILURE")
    throw new Error("Ödeme henüz sonuçlanmadı.");
  if (
    result.paymentStatus === "SUCCESS" &&
    (!paidPrice.equals(expected.total) ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(textField(result.paymentId)))
  )
    throw new Error("Tahsilat tutarı veya ödeme referansı eşleşmiyor.");
  return {
    success: result.paymentStatus === "SUCCESS",
    paymentId: textField(result.paymentId),
    fraudApproved: result.fraudStatus === 1,
  };
}
