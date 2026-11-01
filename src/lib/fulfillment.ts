import type { ReturnStatus } from "@prisma/client";
import { required, ValidationError } from "@/lib/validation";
export const returnStatuses: Record<ReturnStatus, string> = {
  REQUESTED: "Talep Alındı",
  APPROVED: "İade Gönderimi Onaylandı",
  REJECTED: "Talep Reddedildi",
  RECEIVED: "Ürün Teslim Alındı",
  CLOSED: "Talep Kapatıldı",
};
export const returnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED"],
  REJECTED: [],
  RECEIVED: ["CLOSED"],
  CLOSED: [],
};
export function shipmentValues(data: FormData) {
  const shippingCarrier = required(data, "shippingCarrier", 80);
  const trackingNumber = required(data, "trackingNumber", 80);
  if (
    !/^[\p{L}\p{N} .&()-]+$/u.test(shippingCarrier) ||
    !/^[A-Za-z0-9 -]{3,80}$/.test(trackingNumber)
  )
    throw new ValidationError(
      "Geçerli kargo firması ve 3–80 karakterlik takip numarası girin.",
    );
  return { shippingCarrier, trackingNumber };
}
