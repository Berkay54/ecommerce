import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BRAND_NAME } from "@/lib/brand";
import { money } from "@/lib/catalog";
import { orderStatuses } from "@/lib/order-display";

export async function enqueueOrderNotification(
  tx: Prisma.TransactionClient,
  orderId: string,
  event: string,
  message?: string,
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  const id = createHash("sha256").update(`${orderId}:${event}`).digest("hex");
  const status = orderStatuses[order.status];
  const subject = `${BRAND_NAME} · ${order.orderNumber} · ${message ? "Sipariş güncellemesi" : status}`;
  const body = [
    `Merhaba ${order.user.name || ""},`,
    "",
    `${order.orderNumber} numaralı siparişiniz: ${status}.`,
    message || "",
    order.status === "PENDING"
      ? "Ödemeniz henüz onaylanmadı. Bu mesaj ödeme onayı değildir."
      : "",
    "",
    ...order.items.map(
      (item) =>
        `${item.productName || item.product.name}${item.variantName ? ` / ${item.variantName}` : ""} × ${item.quantity}: ${money(item.price.mul(item.quantity))}`,
    ),
    `Toplam: ${money(order.total)}`,
    order.trackingNumber
      ? `Kargo: ${order.shippingCarrier} / Takip numarası: ${order.trackingNumber}`
      : "",
    "",
    "Siparişinizin güncel durumunu mağazada Hesabım > Siparişlerim alanından görebilirsiniz.",
    "Bu bir işlem bildirimidir; kampanya e-postası değildir.",
  ]
    .filter((line) => line !== "")
    .join("\n\n");
  await tx.orderNotification.upsert({
    where: { id },
    create: { id, orderId, recipient: order.user.email, subject, body },
    update: {},
  });
}

export function emailConfiguration() {
  return (
    process.env.ORDER_EMAILS_ENABLED === "true" &&
    !!process.env.RESEND_API_KEY &&
    !!process.env.ORDER_EMAIL_FROM
  );
}
// A persistent outbox makes provider failures independent of order/payment success.
export async function flushOrderNotifications(limit = 5) {
  if (!emailConfiguration()) return { sent: 0, disabled: true };
  const now = new Date();
  const candidates = await prisma.orderNotification.findMany({
    where: {
      status: { in: ["PENDING", "FAILED", "SENDING"] },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  let sent = 0;
  for (const item of candidates) {
    // Resend deduplicates for 24 hours. Do not automatically resend an uncertain
    // attempt after that window; an administrator must reconcile it with Resend.
    if (
      item.firstAttemptAt &&
      now.getTime() - item.firstAttemptAt.getTime() > 23 * 60 * 60 * 1000
    ) {
      await prisma.orderNotification.updateMany({
        where: {
          id: item.id,
          status: { not: "SENT" },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        data: {
          status: "REVIEW",
          lastError:
            "Gönderim penceresi doldu; sağlayıcı kayıtlarıyla kontrol edin.",
        },
      });
      continue;
    }
    const lock = new Date(Date.now() + 120000);
    const claimed = await prisma.orderNotification.updateMany({
      where: {
        id: item.id,
        status: item.status,
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: {
        status: "SENDING",
        lockedUntil: lock,
        firstAttemptAt: item.firstAttemptAt ?? now,
        sender: item.sender ?? process.env.ORDER_EMAIL_FROM!,
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": item.id,
        },
        body: JSON.stringify({
          from: item.sender ?? process.env.ORDER_EMAIL_FROM,
          to: [item.recipient],
          subject: item.subject,
          text: item.body,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Sağlayıcı HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("id" in result) ||
        typeof result.id !== "string"
      )
        throw new Error("Sağlayıcı yanıtı doğrulanamadı.");
      await prisma.orderNotification.updateMany({
        where: { id: item.id, status: "SENDING", lockedUntil: lock },
        data: {
          status: "SENT",
          sentAt: new Date(),
          lockedUntil: null,
          lastError: null,
        },
      });
      sent++;
    } catch (error) {
      await prisma.orderNotification.updateMany({
        where: { id: item.id, status: "SENDING", lockedUntil: lock },
        data: {
          status: "FAILED",
          lockedUntil: new Date(Date.now() + 60000),
          lastError:
            error instanceof Error && /^Sağlayıcı/.test(error.message)
              ? error.message
              : "Gönderim tamamlanamadı; yeniden denenecek.",
        },
      });
    }
  }
  return { sent, disabled: false };
}
export function scheduleOrderEmails() {
  if (!emailConfiguration()) return;
  after(async () => {
    try {
      await flushOrderNotifications();
    } catch {
      console.error("Sipariş e-posta kuyruğu işlenemedi.");
    }
  });
}
