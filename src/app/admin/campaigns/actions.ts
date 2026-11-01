"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { campaignValues } from "@/lib/campaign-validation";
import { defaultCampaigns } from "@/lib/home-campaigns";
import { ValidationError, productImages } from "@/lib/validation";
import type { ActionState } from "@/app/admin/actions";
export async function saveCampaign(
  id: string | null,
  _state: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const uploads = productImages(String(data.get("images") ?? "[]"));
    if (uploads.length > 1)
      throw new ValidationError("Kampanya için yalnızca bir görsel yükleyin.");
    if (uploads[0]) data.set("image", uploads[0].url);
    const values = campaignValues(data);
    if (id) await prisma.campaign.update({ where: { id }, data: values });
    else await prisma.campaign.create({ data: values });
  } catch (error) {
    return {
      error:
        error instanceof ValidationError
          ? error.message
          : "Kampanya kaydedilemedi. Tekrar deneyin.",
    };
  }
  revalidatePath("/", "layout");
  redirect("/admin/campaigns");
}
export async function importCampaigns() {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    for (const [index, slide] of defaultCampaigns(0).entries()) {
      const { id, offer: _offer, ...values } = slide;
      void _offer;
      await tx.campaign.upsert({
        where: { id: `default-${id}` },
        update: {},
        create: {
          ...values,
          id: `default-${id}`,
          active: true,
          sortOrder: index,
          showDiscount: id === "offers",
        },
      });
    }
  });
  revalidatePath("/", "layout");
}
