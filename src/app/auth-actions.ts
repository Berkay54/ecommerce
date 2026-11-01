"use server";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { consumeAuthAttempt } from "@/lib/auth-rate-limit";
import { safeReturnTo } from "@/lib/auth-user";
export type AuthState = { error?: string; success?: string };
export async function register(
  _state: AuthState,
  data: FormData,
): Promise<AuthState> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(data.get("password") ?? "");
  if (
    name.length < 2 ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return { error: "Adınızı ve geçerli bir e-posta adresi girin." };
  if (password.length < 12 || password.length > 128)
    return { error: "Şifreniz 12 ile 128 karakter arasında olmalıdır." };
  if (password !== data.get("passwordConfirm"))
    return { error: "Şifreler eşleşmiyor." };
  try {
    const ip = process.env.VERCEL
      ? ((await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown")
      : "local";
    if (!(await consumeAuthAttempt("register", ip, 20)))
      return {
        error:
          "Çok fazla kayıt denemesi yapıldı. 15 dakika sonra tekrar deneyin.",
      };
    if (
      await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      })
    )
      return {
        error:
          "Bu e-posta adresiyle kayıt oluşturulamıyor. Mevcut hesabınızla giriş yapmayı deneyin.",
      };
    await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: "USER",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Bu e-posta adresiyle kayıt oluşturulamıyor." };
    return {
      error: "Kayıt oluşturulamadı. Lütfen biraz sonra tekrar deneyin.",
    };
  }
  redirect(
    `/giris?kayit=1&next=${encodeURIComponent(safeReturnTo(data.get("next")))}`,
  );
}
export async function login(
  _state: AuthState,
  data: FormData,
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirectTo: safeReturnTo(data.get("next")),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return {
        error:
          "Giriş yapılamadı. E-posta ve şifrenizi kontrol edin; çok sayıda denemeden sonra 15 dakika bekleyin.",
      };
    throw error;
  }
  return {};
}
export async function logout() {
  await signOut({ redirectTo: "/giris" });
}
