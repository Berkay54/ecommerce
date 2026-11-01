"use server";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth-user";
import { parseCart } from "@/lib/cart";
import { createCustomerOrder } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";
import { statusTransitions } from "@/lib/order-display";
import { Prisma, OrderStatus } from "@prisma/client";
import { headers } from "next/headers";
import {
  enqueueOrderNotification,
  scheduleOrderEmails,
} from "@/lib/order-notifications";
import {
  paymentConfig,
  PaymentConfigurationError,
} from "@/lib/payment-validation";
import {
  initializePayment,
  validateBuyer,
  verifyAndCompletePayment,
} from "@/lib/payment-service";
export type OrderState = {
  error?: string;
  success?: string;
  orderNumber?: string;
  redirectUrl?: string;
};
export async function placeOrder(
  _state: OrderState,
  data: FormData,
): Promise<OrderState> {
  const user = await requireUser("/checkout");
  try {
    const config = paymentConfig();
    const requestHeaders = await headers();
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(config.appUrl).hostname,
    );
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      (local ? "127.0.0.1" : "");
    const identityNumber = String(data.get("identityNumber") ?? "").trim();
    validateBuyer(user.name, identityNumber, ip);
    const raw = data.get("cart");
    if (typeof raw !== "string" || raw.length > 40000)
      return { error: "Sepet bilgileri geçersiz." };
    let items;
    try {
      items = parseCart(JSON.parse(raw));
    } catch {
      return { error: "Sepet bilgileri geçersiz. Sepetinizi kontrol edin." };
    }
    const orderNumber = await createCustomerOrder(
      user.id,
      String(data.get("addressId") ?? ""),
      items,
      String(data.get("requestId") ?? ""),
    );
    const redirectUrl = await initializePayment(
      orderNumber,
      user.id,
      identityNumber,
      ip,
    );
    revalidatePath("/", "layout");
    return { redirectUrl };
  } catch (error) {
    return {
      error:
        error instanceof ValidationError ||
        error instanceof PaymentConfigurationError
          ? error.message
          : "Sipariş oluşturulamadı. Sepetiniz korunuyor. Tekrar denemeden önce Siparişlerim sayfasını kontrol edebilirsiniz.",
    };
  }
}
export async function changeOrderStatus(
  id: string,
  _state: OrderState,
  data: FormData,
): Promise<OrderState> {
  await requireAdmin();
  const value = data.get("status");
  if (
    typeof value !== "string" ||
    !Object.values(OrderStatus).includes(value as OrderStatus)
  )
    return { error: "Geçerli bir sipariş durumu seçin." };
  const next = value as OrderStatus;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const order = await tx.order.findUnique({
              where: { id },
              include: { items: true, payment: true },
            });
            if (!order) throw new ValidationError("Sipariş bulunamadı.");
            if (next === "PAID")
              throw new ValidationError(
                "Ödeme durumu yalnızca doğrulanmış iyzico sonucu ile güncellenebilir.",
              );
            if (
              order.payment &&
              (order.payment.status !== "SUCCEEDED" || next === "CANCELLED")
            )
              throw new ValidationError(
                "Sandbox ödemesi yalnızca doğrulanmış callback ile onaylanır. Ödeme iptal/iade işlemleri bu aşamada desteklenmiyor.",
              );
            if (order.status === next) return;
            if (
              next === "SHIPPED" &&
              (!order.shippingCarrier || !order.trackingNumber)
            )
              throw new ValidationError(
                "Önce kargo firması ve takip numarasını kaydedin.",
              );
            if (!statusTransitions[order.status].includes(next))
              throw new ValidationError(
                "Bu durum değişikliğine izin verilmiyor. Güncel sipariş durumunu kontrol edin.",
              );
            const changed = await tx.order.updateMany({
              where: { id, status: order.status },
              data: { status: next },
            });
            if (!changed.count)
              throw new ValidationError(
                "Sipariş başka bir işlemle değişti. Sayfayı yenileyin.",
              );
            if (next === "CANCELLED" && order.inventoryDeducted)
              for (const item of order.items)
                if (item.variantId) {
                  const result = await tx.productVariant.updateMany({
                    where: {
                      id: item.variantId,
                      stock: { lte: 2147483647 - item.quantity },
                    },
                    data: { stock: { increment: item.quantity } },
                  });
                  if (!result.count)
                    throw new ValidationError(
                      "İptal sırasında stok iade edilemedi. Ürünü kontrol edin.",
                    );
                }
            await enqueueOrderNotification(tx, id, `status:${next}`);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 15000,
          },
        );
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        )
          continue;
        throw error;
      }
    }
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Sipariş durumu değiştirilemedi. Tekrar deneyin.",
    };
  }
  revalidatePath("/", "layout");
  scheduleOrderEmails();
  return { success: "Sipariş durumu güncellendi." };
}

export async function refreshPayment(
  id: string,
  _state: OrderState,
): Promise<OrderState> {
  void _state;
  const user = await requireUser(`/odeme/sonuc/${id}`);
  const payment = await prisma.paymentAttempt.findFirst({
    where: { id, order: { userId: user.id } },
    select: { token: true },
  });
  if (!payment?.token)
    return {
      error: "Ödeme bilgisi henüz alınamadı. Lütfen mağazayla iletişime geçin.",
    };
  try {
    await verifyAndCompletePayment(payment.token);
    revalidatePath("/", "layout");
    return { success: "Ödeme durumu güncellendi." };
  } catch {
    return {
      error:
        "Ödeme sonucu şu anda doğrulanamıyor. Yeniden ödeme yapmayın; biraz sonra tekrar kontrol edin.",
    };
  }
}

export async function canSettlePaymentCart(id: string, requestId: string) {
  const user = await requireUser("/hesabim/siparisler");
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || id.length > 100) return false;
  const orderId = createHash("sha256")
    .update(`${user.id}:${requestId}`)
    .digest("hex");
  return !!(await prisma.paymentAttempt.findFirst({
    where: {
      id,
      orderId,
      status: { in: ["SUCCEEDED", "FAILED"] },
      order: { userId: user.id },
    },
    select: { id: true },
  }));
}
