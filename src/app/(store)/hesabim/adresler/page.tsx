import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import AccountLoading from "@/app/(store)/hesabim/loading";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { AddressForm, DeleteAddress } from "@/components/address-form";
type AddressesPageProps = {
  searchParams: Promise<{ next?: string }>;
};
export default function AddressesPage(props: AddressesPageProps) {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AddressesContent {...props} />
    </Suspense>
  );
}
async function AddressesContent({ searchParams }: AddressesPageProps) {
  const user = await requireUser("/hesabim/adresler");
  await connection();
  const query = await searchParams;
  const addresses = await prisma.address.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fullName: true,
      phone: true,
      city: true,
      district: true,
      addressLine: true,
      postalCode: true,
    },
  });
  return (
    <>
      <div className="section-heading">
        <h2>Adreslerim</h2>
        {query.next === "/checkout" && (
          <Link href="/checkout" className="button secondary">
            Siparişe Dön
          </Link>
        )}
      </div>
      <div className="address-list">
        {addresses.map((address) => (
          <article className="panel address-card" key={address.id}>
            <h3>{address.title || "Adres"}</h3>
            <p>
              {address.fullName}
              <br />
              {address.addressLine}
              <br />
              {address.district} / {address.city} {address.postalCode}
              <br />
              {address.phone}
            </p>
            <details>
              <summary className="text-link">Adresi Düzenle</summary>
              <AddressForm address={address} />
            </details>
            <DeleteAddress id={address.id} />
          </article>
        ))}
      </div>
      {!addresses.length && (
        <p className="notice">
          Henüz kayıtlı adresiniz yok. İlk adresinizi aşağıdan ekleyebilirsiniz.
        </p>
      )}
      <section className="panel">
        <h2>Yeni Adres Ekle</h2>
        <AddressForm />
      </section>
    </>
  );
}
