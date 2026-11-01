import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth-user";
import { CampaignForm } from "@/components/campaign-form";
export default function NewCampaign() {
  return (
    <Suspense fallback={<p>Yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  return (
    <>
      <h1>Yeni Kampanya</h1>
      <CampaignForm />
    </>
  );
}
