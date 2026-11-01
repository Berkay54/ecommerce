"use server";
import { ReturnStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { required, text, ValidationError } from "@/lib/validation";
import {
  shipmentValues,
  returnTransitions,
  returnStatuses,
} from "@/lib/fulfillment";
import {
  enqueueOrderNotification,
  scheduleOrderEmails,
  flushOrderNotifications,
} from "@/lib/order-notifications";
import type { ActionState } from "@/app/admin/actions";
export async function saveShipment(
  id: string,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const values = shipmentValues(data);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id } });
      if (!["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
        throw new ValidationError(
          "Kargo bilgisi için sipariş en az Hazırlanıyor durumunda olmalıdır.",
        );
      if (
        order.shippingCarrier === values.shippingCarrier &&
        order.trackingNumber === values.trackingNumber
      )
        return;
      const changed = await tx.order.updateMany({
        where: { id, updatedAt: order.updatedAt },
        data: values,
      });
      if (!changed.count)
        throw new ValidationError("Sipariş değişti. Sayfayı yenileyin.");
      if (order.status !== "PROCESSING")
        await enqueueOrderNotification(
          tx,
          id,
          `tracking:${values.shippingCarrier}:${values.trackingNumber}`,
          "Kargo takip bilgileriniz güncellendi.",
        );
    });
    scheduleOrderEmails();
    revalidatePath("/", "layout");
    return { success: "Kargo bilgileri kaydedildi." };
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Kargo bilgileri kaydedilemedi.",
    };
  }
}
export async function requestReturn(
  id: string,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  const user = await requireUser("/hesabim/siparisler");
  try {
    const reason = required(data, "reason", 2000);
    if (reason.length < 10)
      throw new ValidationError("İade nedenini en az 10 karakterle açıklayın.");
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId: user.id, status: "DELIVERED" },
        include: { returns: true },
      });
      if (!order)
        throw new ValidationError(
          "Yalnızca size ait teslim edilmiş sipariş için talep oluşturabilirsiniz.",
        );
      if (order.returns.length)
        throw new ValidationError(
          "Bu sipariş için mevcut iade talebinizi aşağıdan takip edebilirsiniz.",
        );
      await tx.returnRequest.create({ data: { orderId: id, reason } });
      await enqueueOrderNotification(
        tx,
        id,
        "return-requested",
        "İade talebiniz alındı ve mağaza incelemesine iletildi. Bu mesaj iade veya geri ödeme onayı değildir.",
      );
    });
    scheduleOrderEmails();
    revalidatePath("/", "layout");
    return {
      success:
        "İade talebiniz alındı. Sonucu siparişinizden takip edebilirsiniz.",
    };
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Talep kaydedilemedi. Mevcut taleplerinizi kontrol edin.",
    };
  }
}
export async function updateReturn(
  id: string,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const status = String(data.get("status"));
    if (!Object.values(ReturnStatus).includes(status as ReturnStatus))
      throw new ValidationError("Geçerli bir durum seçin.");
    const next = status as ReturnStatus;
    const adminNote = text(data, "adminNote", 2000);
    await prisma.$transaction(async (tx) => {
      const request = await tx.returnRequest.findUniqueOrThrow({
        where: { id },
      });
      if (!returnTransitions[request.status].includes(next))
        throw new ValidationError(
          "Bu durum geçişi desteklenmiyor. Sayfayı yenileyin.",
        );
      if (!adminNote)
        throw new ValidationError("Müşteriye gösterilecek bir açıklama girin.");
      const changed = await tx.returnRequest.updateMany({
        where: { id, status: request.status },
        data: { status: next, adminNote },
      });
      if (!changed.count)
        throw new ValidationError("Talep değişti. Sayfayı yenileyin.");
      await enqueueOrderNotification(
        tx,
        request.orderId,
        `return:${id}:${next}`,
        `İade talebi: ${returnStatuses[next]}. Açıklama: ${adminNote}. Para iadesi bu sistem üzerinden otomatik yapılmaz.`,
      );
    });
    scheduleOrderEmails();
    revalidatePath("/", "layout");
    return { success: "İade talebi güncellendi." };
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Talep güncellenemedi.",
    };
  }
}
export async function retryNotifications(
  _state: ActionState,
): Promise<ActionState> {
  void _state;
  await requireAdmin();
  try {
    const result = await flushOrderNotifications();
    revalidatePath("/admin/notifications");
    return result.disabled
      ? { error: "E-posta gönderimi kapalı veya yapılandırma eksik." }
      : {
          success: `${result.sent} bildirim gönderildi. İnceleme kayıtlarını sağlayıcı panelinden doğrulayın.`,
        };
  } catch {
    return { error: "Kuyruk şu anda işlenemedi." };
  }
}
