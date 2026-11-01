import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-user";
import { importCampaigns } from "./actions";
export default function Campaigns() {
  return (
    <Suspense fallback={<p role="status">Kampanyalar yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  await connection();
  const campaigns = await prisma.campaign.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <>
      <div className="section-heading">
        <h1>Kampanyalar</h1>
        <Link href="/admin/campaigns/new" className="button">
          Yeni Kampanya
        </Link>
      </div>
      {!campaigns.length && (
        <section className="panel">
          <p>
            Vitrin şu anda başlangıç slaytlarını kullanıyor. Düzenlemek için
            panele aktarabilirsiniz.
          </p>
          <form action={importCampaigns}>
            <button className="button secondary">
              Başlangıç Slaytlarını Panele Aktar
            </button>
          </form>
        </section>
      )}
      <div className="admin-campaign-list">
        {campaigns.map((campaign) => (
          <article className="panel" key={campaign.id}>
            <span className="status">
              {campaign.active ? "Yayında" : "Taslak"} · Sıra{" "}
              {campaign.sortOrder}
            </span>
            <h2>
              {campaign.title} {campaign.emphasis}
            </h2>
            <p>{campaign.label}</p>
            <Link
              href={`/admin/campaigns/${campaign.id}`}
              className="text-link"
            >
              Düzenle →
            </Link>
          </article>
        ))}
      </div>
      {!!campaigns.length && !campaigns.some((c) => c.active) && (
        <p className="notice">
          Tüm kampanyalar kapalı. Ana sayfada slayt alanı gösterilmiyor.
        </p>
      )}
    </>
  );
}
