"use client";
import Image from "next/image";
import { useActionState, useState } from "react";
import type { Campaign } from "@prisma/client";
import { saveCampaign } from "@/app/admin/campaigns/actions";
import { ProductImages } from "@/components/product-images";
type Values = Omit<Campaign, "createdAt" | "updatedAt">;
export function CampaignForm({ campaign }: { campaign?: Values }) {
  const [state, action, pending] = useActionState(
    saveCampaign.bind(null, campaign?.id ?? null),
    {},
  );
  const [blocked, setBlocked] = useState(false);
  return (
    <form action={action} className="editor">
      <section className="panel">
        <h2>Kampanya İçeriği</h2>
        {campaign?.image && (
          <Image
            src={campaign.image}
            alt={campaign.alt}
            width={520}
            height={240}
            className="campaign-editor-preview"
            unoptimized
          />
        )}
        <label>
          Üst etiket
          <input
            name="label"
            required
            maxLength={70}
            defaultValue={campaign?.label}
          />
        </label>
        <label>
          Başlık
          <input
            name="title"
            required
            maxLength={32}
            defaultValue={campaign?.title}
          />
        </label>
        <label>
          Vurgulu ikinci satır
          <input
            name="emphasis"
            required
            maxLength={32}
            defaultValue={campaign?.emphasis}
          />
        </label>
        <label>
          Açıklama
          <textarea
            name="description"
            required
            maxLength={240}
            defaultValue={campaign?.description}
          />
        </label>
        <label>
          Düğme metni
          <input
            name="action"
            required
            maxLength={50}
            defaultValue={campaign?.action}
          />
        </label>
        <label>
          Mağaza içi bağlantı
          <input
            name="href"
            required
            maxLength={1000}
            defaultValue={campaign?.href ?? "/products"}
          />
        </label>
        <label>
          Alt not
          <input name="note" maxLength={140} defaultValue={campaign?.note} />
        </label>
        <label>
          Görsel adresi
          <input
            name="image"
            maxLength={2000}
            defaultValue={campaign?.image}
            placeholder="https://… veya /campaigns/editorial.webp"
          />
        </label>
        <label>
          Görsel alternatif metni
          <input
            name="alt"
            required
            maxLength={300}
            defaultValue={campaign?.alt}
          />
        </label>
        <details>
          <summary>Yeni görsel yükle</summary>
          <p className="muted">
            Tek bir görsel yükleyin. Yüklenen görsel, yukarıdaki adresin yerine
            otomatik olarak kaydedilir. Vercel Blob kurulumu gerektirir.
          </p>
          <ProductImages
            initialImages={[]}
            disabled={pending}
            onBlockedChange={setBlocked}
          />
        </details>
      </section>
      <aside className="panel">
        <h2>Yayın Ayarları</h2>
        <label>
          Tema
          <select name="theme" defaultValue={campaign?.theme ?? "forest"}>
            <option value="forest">Orman yeşili</option>
            <option value="sand">Kum</option>
            <option value="wine">Bordo</option>
          </select>
        </label>
        <label>
          Sıra
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000}
            required
            defaultValue={campaign?.sortOrder ?? 0}
          />
        </label>
        <label>
          <input
            name="active"
            type="checkbox"
            defaultChecked={campaign?.active ?? false}
          />
          Yayında
        </label>
        <label>
          <input
            name="showDiscount"
            type="checkbox"
            defaultChecked={campaign?.showDiscount ?? false}
          />
          Gerçek katalog indirimini göster
        </label>
        <p className="muted">
          Yayındaki ilk 6 kampanya sırayla gösterilir. İndirim oranı stokta
          bulunan vitrin ürünlerinden hesaplanır. Girilen metinleri gerçek
          kampanya koşullarıyla uyumlu tutun.
        </p>
        {state.error && (
          <p role="alert" className="notice error">
            {state.error}
          </p>
        )}
        <button className="button" disabled={pending || blocked}>
          {pending ? "Kaydediliyor…" : "Kampanyayı Kaydet"}
        </button>
      </aside>
    </form>
  );
}
