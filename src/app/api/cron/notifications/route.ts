import { timingSafeEqual } from "node:crypto";
import { flushOrderNotifications } from "@/lib/order-notifications";
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get("authorization") ?? "";
  const token = expected ? `Bearer ${expected}` : "";
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(token) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(token))
  )
    return Response.json({ error: "Yetkisiz işlem." }, { status: 401 });
  try {
    return Response.json(await flushOrderNotifications(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Kuyruk işlenemedi." }, { status: 503 });
  }
}
