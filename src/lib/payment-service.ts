import "server-only";
import {
  enqueueOrderNotification,
  scheduleOrderEmails,
} from "@/lib/order-notifications";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { iyzicoClient, sdkCall } from "@/lib/iyzico";
import {
  hostedPaymentUrl,
  paymentConfig,
  textField,
  validatePaymentResult,
  verifySignature,
} from "@/lib/payment-validation";
import { ValidationError } from "@/lib/validation";

export function validateBuyer(
  name: string | null,
  identityNumber: string,
  ip: string,
) {
  const parts = name?.trim().split(/\s+/) ?? [];
  if (parts.length < 2 || !parts.every((p) => p.length > 0))
    throw new ValidationError(
      "Hesap adınız ad ve soyad içermelidir. Mağaza yöneticisiyle iletişime geçin.",
    );
  if (!/^[1-9]\d{10}$/.test(identityNumber))
    throw new ValidationError(
      "Ödeme için 11 haneli T.C. kimlik numaranızı girin.",
    );
  if (!isIP(ip))
    throw new ValidationError(
      "İstemci adresi doğrulanamadı. Lütfen tekrar deneyin.",
    );
  return { name: parts.slice(0, -1).join(" "), surname: parts.at(-1)! };
}

export async function initializePayment(
  orderNumber: string,
  userId: string,
  identityNumber: string,
  ip: string,
) {
  const config = paymentConfig();
  const order = await prisma.order.findFirstOrThrow({
    where: { orderNumber, userId },
    include: {
      user: true,
      address: true,
      payment: true,
      items: {
        include: { variant: true, product: { include: { category: true } } },
      },
    },
  });
  const payment = order.payment;
  if (!payment)
    throw new ValidationError("Bu sipariş için ödeme başlatılamıyor.");
  const resultUrl = `/odeme/sonuc/${payment.id}`;
  if (["SUCCEEDED", "FAILED", "REVIEW"].includes(payment.status))
    return resultUrl;
  if (order.status !== "PENDING" || order.inventoryDeducted)
    throw new ValidationError("Bu sipariş için ödeme başlatılamıyor.");
  if (payment.status === "READY" && payment.paymentPageUrl)
    return hostedPaymentUrl(payment.paymentPageUrl);
  if (payment.status !== "CREATED") return resultUrl;
  if (
    order.items.some(
      (item) =>
        !item.product.active ||
        !item.variant ||
        item.variant.stock < item.quantity ||
        !(item.variant.price ?? item.product.price).equals(item.price),
    ) ||
    order.total.lte(0) ||
    order.address.deletedAt
  ) {
    await prisma.paymentAttempt.updateMany({
      where: { id: payment.id, status: "CREATED" },
      data: { status: "FAILED", issue: "CART_CHANGED" },
    });
    return resultUrl;
  }
  const buyerName = validateBuyer(order.user.name, identityNumber, ip);
  const snapshot = order.shippingAddress;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    throw new ValidationError("Siparişin teslimat adresi doğrulanamadı.");
  const field = (key: string) =>
    typeof snapshot[key] === "string" ? (snapshot[key] as string) : "";
  const address = {
    fullName: field("fullName"),
    city: field("city"),
    district: field("district"),
    addressLine: field("addressLine"),
    postalCode: field("postalCode"),
    phone: field("phone"),
  };
  // Delivery and billing use the user's explicitly selected Turkish address.
  const shippingAddress = {
    contactName: address.fullName,
    city: address.city,
    country: "Turkey",
    address: `${address.addressLine}, ${address.district}`,
    ...(address.postalCode ? { zipCode: address.postalCode } : {}),
  };
  const phone = address.phone.replace(/\D/g, "").replace(/^0/, "");
  if (!/^(90)?5\d{9}$/.test(phone)) {
    await prisma.paymentAttempt.updateMany({
      where: { id: payment.id, status: "CREATED" },
      data: { status: "FAILED", issue: "INVALID_PHONE" },
    });
    return resultUrl;
  }
  const claimed = await prisma.paymentAttempt.updateMany({
    where: { id: payment.id, status: "CREATED" },
    data: { status: "INITIALIZING" },
  });
  if (!claimed.count) return resultUrl;
  // Never retry an uncertain initialize call automatically: it may have succeeded remotely.
  const client = iyzicoClient();
  try {
    const result = await sdkCall((cb) =>
      client.checkoutFormInitialize.create(
        {
          locale: "tr",
          currency: "TRY",
          conversationId: payment.id,
          basketId: order.id,
          price: order.total.toFixed(2),
          paidPrice: order.total.toFixed(2),
          paymentGroup: "PRODUCT",
          enabledInstallments: [1],
          callbackUrl: `${config.appUrl}/api/payments/iyzico/callback`,
          buyer: {
            id: userId,
            ...buyerName,
            email: order.user.email,
            gsmNumber: `+${phone.startsWith("90") ? phone : `90${phone}`}`,
            identityNumber,
            registrationAddress: shippingAddress.address,
            city: address.city,
            country: "Turkey",
            ip,
          },
          shippingAddress,
          billingAddress: shippingAddress,
          basketItems: order.items.map((item) => ({
            id: item.id,
            name: item.productName ?? item.product.name,
            category1: item.product.category?.name ?? "Ürünler",
            itemType: "PHYSICAL",
            price: item.price.mul(item.quantity).toFixed(2),
          })),
        },
        cb,
      ),
    );
    if (result.status === "failure") {
      await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: { status: "FAILED", issue: "INITIALIZE_REJECTED" },
      });
      return resultUrl;
    }
    const token = textField(result.token);
    if (
      result.status !== "success" ||
      result.conversationId !== payment.id ||
      token.length < 10 ||
      token.length > 500 ||
      !verifySignature(
        [result.conversationId, result.token],
        result.signature,
        config.secretKey,
      )
    )
      throw new Error("Initialize response verification failed");
    const url = hostedPaymentUrl(result.paymentPageUrl);
    await prisma.paymentAttempt.update({
      where: { id: payment.id },
      data: { token, paymentPageUrl: url, status: "READY", issue: null },
    });
    return url;
  } catch {
    // No request/response body is logged; it can contain personal/payment data.
    await prisma.paymentAttempt.updateMany({
      where: { id: payment.id, status: "INITIALIZING" },
      data: { issue: "INITIALIZE_UNCERTAIN" },
    });
    return resultUrl;
  }
}

class InventoryConflict extends Error {}
async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  for (let retry = 0; ; retry++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
        timeout: 15000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        retry < 2
      )
        continue;
      throw error;
    }
  }
}

export async function verifyAndCompletePayment(token: string) {
  const payment = await prisma.paymentAttempt.findUnique({
    where: { token },
    include: { order: true },
  });
  if (!payment) return null;
  if (payment.status === "SUCCEEDED" || payment.status === "FAILED")
    return payment.id;
  const config = paymentConfig();
  const client = iyzicoClient();
  const result = await sdkCall((cb) =>
    client.checkoutForm.retrieve(
      { locale: "tr", conversationId: payment.id, token },
      cb,
    ),
  );
  // status=failure without a signed final result is NOT proof of a declined payment.
  if (result.status !== "success")
    throw new Error("Payment result unavailable");
  const verified = validatePaymentResult(
    result,
    {
      id: payment.id,
      orderId: payment.orderId,
      token,
      total: payment.order.total,
    },
    config.secretKey,
  );
  if (!verified.success) {
    await prisma.paymentAttempt.updateMany({
      where: { id: payment.id, status: { in: ["READY", "INITIALIZING"] } },
      data: { status: "FAILED", issue: "PAYMENT_DECLINED" },
    });
    return payment.id;
  }
  // Store only per-line references/amounts needed for reconciliation, never card fields.
  const itemTransactions: Prisma.InputJsonValue = Array.isArray(
    result.itemTransactions,
  )
    ? result.itemTransactions.flatMap((value: unknown) => {
        if (!value || typeof value !== "object" || Array.isArray(value))
          return [];
        const row = value as Record<string, unknown>;
        return [
          {
            itemId: textField(row.itemId),
            paymentTransactionId: textField(row.paymentTransactionId),
            price: String(row.price ?? ""),
            paidPrice: String(row.paidPrice ?? ""),
          },
        ];
      })
    : [];
  const receipt = {
    paymentId: verified.paymentId,
    paidAt: payment.paidAt ?? new Date(),
    itemTransactions,
  };
  try {
    await serializable(async (tx) => {
      const current = await tx.paymentAttempt.findUniqueOrThrow({
        where: { id: payment.id },
        include: { order: { include: { items: true } } },
      });
      if (current.status === "SUCCEEDED") return;
      const order = current.order;
      if (
        !verified.fraudApproved ||
        order.status !== "PENDING" ||
        order.inventoryDeducted
      )
        throw new InventoryConflict("FRAUD_OR_ORDER_REVIEW");
      for (const item of order.items) {
        if (!item.variantId) throw new InventoryConflict("STOCK_UNAVAILABLE");
        const changed = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
            stock: { gte: item.quantity },
            product: { active: true },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (changed.count !== 1)
          throw new InventoryConflict("STOCK_UNAVAILABLE");
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", inventoryDeducted: true },
      });
      await tx.paymentAttempt.update({
        where: { id: payment.id },
        data: { ...receipt, status: "SUCCEEDED", issue: null },
      });
      await enqueueOrderNotification(tx, order.id, "paid");
      await tx.cartItem.deleteMany({
        where: { cart: { userId: order.userId } },
      });
    });
  } catch (error) {
    if (!(error instanceof InventoryConflict)) throw error;
    // A real successful payment must remain visible even if fulfillment is blocked.
    await prisma.paymentAttempt.updateMany({
      where: { id: payment.id, status: { not: "SUCCEEDED" } },
      data: { ...receipt, status: "REVIEW", issue: error.message },
    });
  }
  scheduleOrderEmails();
  return payment.id;
}
