"use server";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ValidationError, required } from "@/lib/validation";
import type { ActionState } from "@/app/admin/actions";
export async function submitReview(
  productId: string,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  try {
    const rating = Number(required(data, "rating"));
    const comment = required(data, "comment", 2000);
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      comment.length < 10
    )
      throw new ValidationError(
        "1–5 arasında puan ve en az 10 karakterlik yorum girin.",
      );
    await prisma.$transaction(async (tx) => {
      const eligible = await tx.orderItem.findFirst({
        where: {
          productId,
          product: { active: true },
          order: {
            userId: user.id,
            status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
            OR: [
              { payment: { is: null } },
              { payment: { status: "SUCCEEDED" } },
            ],
          },
        },
        select: { id: true },
      });
      if (!eligible)
        throw new ValidationError(
          "Yalnızca satın aldığınız ürünleri değerlendirebilirsiniz.",
        );
      await tx.review.upsert({
        where: { userId_productId: { userId: user.id, productId } },
        create: { userId: user.id, productId, rating, comment },
        update: { rating, comment, approved: false },
      });
    });
    revalidatePath("/", "layout");
    return {
      success: "Yorumunuz alındı. Yönetici onayından sonra yayımlanacaktır.",
    };
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Yorum kaydedilemedi. Tekrar deneyin.",
    };
  }
}
export async function moderateReview(
  id: string,
  rating: number,
  comment: string | null,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const value = data.get("approved");
  if (value !== "true" && value !== "false")
    return { error: "Geçersiz işlem." };
  try {
    const changed = await prisma.review.updateMany({
      where: { id, rating, comment },
      data: { approved: value === "true" },
    });
    if (!changed.count)
      return {
        error: "Yorum içeriği değişti. Sayfayı yenileyip yeniden inceleyin.",
      };
    revalidatePath("/", "layout");
    return {
      success:
        value === "true" ? "Yorum yayımlandı." : "Yorum yayından kaldırıldı.",
    };
  } catch {
    return { error: "Yorum güncellenemedi." };
  }
}
