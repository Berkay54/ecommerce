import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { imageFileError, MAX_IMAGE_BYTES } from "@/lib/images";
import {
  deleteUnreferencedBlob,
  isProductBlob,
  PRODUCT_BLOB_PREFIX,
} from "@/lib/blob-storage";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth-user";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return Response.json(
      { error: "Bu işlem için yönetici girişi gerekiyor." },
      { status: user ? 403 : 401 },
    );
  if (!sameOrigin(request))
    return Response.json(
      { error: "Görselleri ürün düzenleyicisinden yükleyin." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 65536)
    return Response.json(
      { error: "Her görsel en fazla 3 MB olmalıdır." },
      { status: 413 },
    );
  let bytes: Buffer;
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File))
      throw new Error("Yüklenecek bir görsel seçin.");
    if (file.size > MAX_IMAGE_BYTES)
      return Response.json(
        { error: "Her görsel en fazla 3 MB olmalıdır." },
        { status: 413 },
      );
    const error = imageFileError(file);
    if (error) throw new Error(error);
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    const formats: Record<string, string> = {
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    if (
      !metadata.format ||
      formats[metadata.format] !== file.type ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error(
        "Dosya içeriği JPEG, PNG veya WebP biçimiyle eşleşmelidir. Hareketli görseller desteklenmiyor.",
      );
    // Decode the image fully, apply camera orientation, and strip metadata before storage.
    bytes = await image.rotate().webp({ quality: 88 }).toBuffer();
    if (bytes.length > MAX_IMAGE_BYTES)
      throw new Error(
        "İşlenen görsel çok büyük. Boyutlarını küçültüp tekrar deneyin.",
      );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error &&
          !/sharp|Input|pixel|corrupt|unsupported/i.test(error.message)
            ? error.message
            : "Dosya görsel olarak okunamadı. 40 megapikselin altında geçerli bir JPEG, PNG veya WebP seçin.",
      },
      { status: 400 },
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return Response.json(
      {
        error:
          "Görsel depolama henüz yapılandırılmadı. Yapılandırmayı tamamladıktan sonra tekrar deneyin; mevcut görsel adreslerini kullanabilirsiniz.",
      },
      { status: 503 },
    );
  try {
    const blob = await put(
      `${PRODUCT_BLOB_PREFIX}${randomUUID()}.webp`,
      bytes,
      { access: "public", contentType: "image/webp", addRandomSuffix: true },
    );
    return Response.json(
      { url: blob.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Görsel yüklenemedi. Depolama yapılandırmasını kontrol edip tekrar deneyin. Diğer değişiklikleriniz korundu.",
      },
      { status: 502 },
    );
  }
}
export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return Response.json(
      { error: "Bu işlem için yönetici girişi gerekiyor." },
      { status: user ? 403 : 401 },
    );
  if (!sameOrigin(request))
    return Response.json(
      { error: "Görselleri ürün düzenleyicisinden silin." },
      { status: 403 },
    );
  try {
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("url" in body) ||
      typeof body.url !== "string" ||
      !isProductBlob(body.url)
    )
      return Response.json(
        {
          error:
            "Yalnızca bu düzenleyiciyle yüklenen görseller depolamadan silinebilir.",
        },
        { status: 400 },
      );
    if (
      (await prisma.productImage.count({ where: { url: body.url } })) ||
      (await prisma.campaign.count({ where: { image: body.url } }))
    )
      return Response.json(
        {
          error:
            "Görsel bir ürün veya kampanyada kullanılıyor. Önce ilgili kaydı değiştirip kaydedin.",
        },
        { status: 409 },
      );
    await deleteUnreferencedBlob(body.url);
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Yüklenen dosya silinemedi. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }
}
