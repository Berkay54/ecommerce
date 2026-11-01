import "server-only";
import { createHash, randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cartKey, type CartInput } from "@/lib/cart";
import { ValidationError } from "@/lib/validation";

export const orderInclude = {
  payment: {
    select: {
      id: true,
      status: true,
      paymentId: true,
      paidAt: true,
      issue: true,
    },
  },
  address: true,
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: { select: { name: true, slug: true } },
      variant: { select: { name: true, sku: true } },
    },
  },
} satisfies Prisma.OrderInclude;
export type OrderDetail = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;
function canonical(items: CartInput[]) {
  return JSON.stringify(
    items
      .map((item) => ({ key: cartKey(item), quantity: item.quantity }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );
}
function orderNumber() {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\D/g, "");
  return `SIP-${day}-${randomInt(10000000, 100000000)}`;
}
export async function createCustomerOrder(
  userId: string,
  addressId: string,
  items: CartInput[],
  requestId: string,
) {
  if (!items.length)
    throw new ValidationError("Sepetiniz boş. Önce ürün ekleyin.");
  if (
    !/^[0-9a-f-]{36}$/i.test(requestId) ||
    !addressId ||
    addressId.length > 100
  )
    throw new ValidationError(
      "Sipariş bilgileri geçersiz. Sayfayı yenileyip tekrar deneyin.",
    );
  const id = createHash("sha256")
    .update(`${userId}:${requestId}`)
    .digest("hex");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.order.findUnique({
            where: { id },
            include: { items: true },
          });
          if (existing) {
            if (
              existing.userId !== userId ||
              existing.addressId !== addressId ||
              canonical(existing.items) !== canonical(items)
            )
              throw new ValidationError(
                "Bu sipariş isteği daha önce kullanıldı. Siparişlerinizi kontrol edin ve sayfayı yenileyin.",
              );
            return existing.orderNumber;
          }
          const address = await tx.address.findFirst({
            where: { id: addressId, userId, deletedAt: null },
          });
          if (!address)
            throw new ValidationError(
              "Size ait geçerli bir teslimat adresi seçin.",
            );
          const products = await tx.product.findMany({
            where: {
              id: { in: items.map((item) => item.productId) },
              active: true,
            },
            include: { variants: true },
          });
          let total = new Prisma.Decimal(0);
          const lines: {
            productId: string;
            variantId: string;
            quantity: number;
            price: Prisma.Decimal;
            productName: string;
            variantName: string;
          }[] = [];
          for (const item of items) {
            const product = products.find((row) => row.id === item.productId);
            const variant = product?.variants.find(
              (row) => row.id === item.variantId,
            );
            if (!product || !variant)
              throw new ValidationError(
                "Sepetinizdeki bir ürün veya varyant artık satışa uygun değil. Sepetinizi güncelleyin.",
              );
            if (variant.stock < item.quantity)
              throw new ValidationError(
                `${product.name} (${variant.name}) için yeterli stok yok. Mevcut stok: ${variant.stock}.`,
              );
            const price = variant.price ?? product.price;
            if (price.isNegative())
              throw new ValidationError(
                "Ürün fiyatı geçersiz. Mağazayla iletişime geçin.",
              );
            total = total.plus(price.mul(item.quantity));
            lines.push({
              productId: product.id,
              variantId: variant.id,
              quantity: item.quantity,
              price,
              productName: product.name,
              variantName: variant.name,
            });
          }
          if (total.greaterThan("99999999.99"))
            throw new ValidationError(
              "Sipariş toplamı izin verilen sınırı aşıyor. Ürün adedini azaltın.",
            );
          const {
            title,
            fullName,
            phone,
            city,
            district,
            addressLine,
            postalCode,
          } = address;
          const order = await tx.order.create({
            data: {
              id,
              orderNumber: orderNumber(),
              userId,
              addressId,
              status: "PENDING",
              inventoryDeducted: false,
              payment: { create: {} },
              total,
              shippingAddress: {
                title,
                fullName,
                phone,
                city,
                district,
                addressLine,
                postalCode,
              },
              items: { create: lines },
            },
          });
          return order.orderNumber;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 15000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 2
      )
        continue;
      throw error;
    }
  }
  throw new ValidationError("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
}
