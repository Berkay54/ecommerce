import type { OrderStatus } from "@prisma/client";
export const orderStatuses: Record<OrderStatus, string> = {
  PENDING: "Sipariş Alındı",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};
export const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export type AddressValue = {
  id: string;
  title: string | null;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string | null;
};
export function orderDate(value: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
