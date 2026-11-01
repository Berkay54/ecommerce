import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/campaign-form";
type Props = { params: Promise<{ id: string }> };
export default function EditCampaign(props: Props) {
  return (
    <Suspense fallback={<p>Yükleniyor…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
async function Content({ params }: Props) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...values } = campaign;
  void _createdAt;
  void _updatedAt;
  return (
    <>
      <h1>Kampanyayı Düzenle</h1>
      <CampaignForm campaign={values} />
    </>
  );
}
