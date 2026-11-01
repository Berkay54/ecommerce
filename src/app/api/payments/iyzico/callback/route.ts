import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { paymentConfig } from "@/lib/payment-validation";
import { verifyAndCompletePayment } from "@/lib/payment-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let appUrl: string;
  try {
    appUrl = paymentConfig().appUrl;
  } catch {
    return NextResponse.json(
      { error: "Sandbox ödeme ayarları eksik." },
      { status: 503 },
    );
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 4096)
    return NextResponse.json({ error: "Geçersiz callback." }, { status: 413 });
  let token = "";
  try {
    // Only the token is accepted. Payment status/amount in the browser POST is ignored.
    const body = await request.text();
    if (body.length > 4096) throw new Error();
    token = new URLSearchParams(body).get("token") ?? "";
    if (!/^[a-zA-Z0-9_-]{10,500}$/.test(token)) throw new Error();
  } catch {
    return NextResponse.redirect(`${appUrl}/odeme/basarisiz`, 303);
  }
  try {
    const id = await verifyAndCompletePayment(token);
    revalidatePath("/", "layout");
    return NextResponse.redirect(
      `${appUrl}${id ? `/odeme/sonuc/${id}` : "/odeme/basarisiz"}`,
      303,
    );
  } catch {
    // A transient API/database problem is an uncertain payment, never a payment failure.
    const payment = await prisma.paymentAttempt
      .findUnique({ where: { token }, select: { id: true } })
      .catch(() => null);
    if (!payment)
      return NextResponse.json(
        {
          error:
            "Ödeme doğrulanamadı. Mağazayla iletişime geçin; yeniden ödeme yapmayın.",
        },
        { status: 503 },
      );
    return NextResponse.redirect(`${appUrl}/odeme/sonuc/${payment.id}`, 303);
  }
}
