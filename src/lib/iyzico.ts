import "server-only";
import Iyzipay from "iyzipay";
import { paymentConfig, record } from "@/lib/payment-validation";

// A fresh SDK instance per call: its resources mutate their shared request config.
export function iyzicoClient() {
  return new Iyzipay(paymentConfig());
}
export function sdkCall(
  invoke: (callback: (error: unknown, result: unknown) => void) => void,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Ödeme servisi zamanında yanıt vermedi.")),
      20000,
    );
    try {
      invoke((error, result) => {
        clearTimeout(timer);
        if (error) return reject(new Error("Ödeme servisine bağlanılamadı."));
        try {
          resolve(record(result));
        } catch {
          reject(new Error("Ödeme yanıtı okunamadı."));
        }
      });
    } catch {
      clearTimeout(timer);
      reject(new Error("Ödeme isteği gönderilemedi."));
    }
  });
}
