"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";
export type AccountState = { error?: string; success?: string };
export async function saveAddress(
  id: string | null,
  _state: AccountState,
  data: FormData,
): Promise<AccountState> {
  const user = await requireUser("/hesabim/adresler");
  try {
    const field = (
      key: string,
      label: string,
      max: number,
      optional = false,
    ) => {
      const raw = data.get(key);
      if (
        typeof raw !== "string" ||
        raw.trim().length > max ||
        (!optional && raw.trim().length < 2)
      )
        throw new ValidationError(`${label} alanını kontrol edin.`);
      return raw.trim();
    };
    const phone = field("phone", "Telefon", 25).replace(/[\s()-]/g, "");
    if (!/^(?:\+90|0)?[2-5]\d{9}$/.test(phone))
      throw new ValidationError(
        "Geçerli bir Türkiye telefon numarası girin (ör. 05321234567).",
      );
    const postalCode = field("postalCode", "Posta Kodu", 5, true);
    if (postalCode && !/^\d{5}$/.test(postalCode))
      throw new ValidationError("Posta kodu 5 rakamdan oluşmalıdır.");
    const values = {
      title: field("title", "Adres Başlığı", 60),
      fullName: field("fullName", "Ad Soyad", 120),
      phone,
      city: field("city", "İl", 80),
      district: field("district", "İlçe", 80),
      addressLine: field("addressLine", "Açık Adres", 1000),
      postalCode: postalCode || null,
    };
    if (id) {
      const result = await prisma.address.updateMany({
        where: { id, userId: user.id, deletedAt: null },
        data: values,
      });
      if (!result.count)
        throw new ValidationError(
          "Adres bulunamadı veya bu işlem için yetkiniz yok.",
        );
    } else
      await prisma.address.create({ data: { ...values, userId: user.id } });
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Adres kaydedilemedi. Lütfen tekrar deneyin.",
    };
  }
  revalidatePath("/hesabim/adresler");
  revalidatePath("/checkout");
  return { success: "Adres kaydedildi." };
}
export async function deleteAddress(
  id: string,
  _state: AccountState,
): Promise<AccountState> {
  void _state;
  const user = await requireUser("/hesabim/adresler");
  try {
    const result = await prisma.address.updateMany({
      where: { id, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count)
      return { error: "Adres bulunamadı veya bu işlem için yetkiniz yok." };
  } catch {
    return { error: "Adres silinemedi. Lütfen tekrar deneyin." };
  }
  revalidatePath("/hesabim/adresler");
  revalidatePath("/checkout");
  return { success: "Adres silindi." };
}
