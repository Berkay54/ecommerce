import { requireAdmin } from "@/lib/auth-user";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminLoading from "@/app/admin/loading";
import { prisma } from "@/lib/prisma";
import { productInclude, money } from "@/lib/catalog";
type ProductsPageProps = {
  searchParams: Promise<{
    saved?: string;
    deleted?: string;
    page?: string;
    cleanup?: string;
  }>;
};
export default function Products(props: ProductsPageProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsContent {...props} />
    </Suspense>
  );
}
async function ProductsContent({ searchParams }: ProductsPageProps) {
  await requireAdmin();
  await connection();
  const query = await searchParams;
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1)) | 0;
  const [products, count, active, featured] = await Promise.all([
    prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
      skip: (page - 1) * 30,
    }),
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { featured: true } }),
  ]);
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Yönetim Paneli / Ürünler</p>
          <h1>Ürünler</h1>
          <p className="muted">
            Ürünlerinizi, fiyatlarınızı ve stok durumunu buradan yönetin.
          </p>
        </div>
        <Link className="button" href="/admin/products/new">
          + Yeni Ürün
        </Link>
      </div>
      {(query.saved || query.deleted) && (
        <p role="status" className="notice">
          {query.saved
            ? "Ürün kaydedildi. Mağazanız güncellendi."
            : "Ürün silindi."}
        </p>
      )}
      {query.cleanup && (
        <p className="notice error" role="alert">
          Ürün kaydedildi ancak kullanılmayan bazı görseller silinemedi.
          Kullanılmayan dosyaları depolama panelinden kaldırabilirsiniz.
        </p>
      )}
      <div className="stats">
        <div>
          <span>{count}</span>Toplam Ürün
        </div>
        <div>
          <span>{active}</span>Aktif Ürün
        </div>
        <div>
          <span>{featured}</span>Öne Çıkan
        </div>
      </div>
      {products.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Durum</th>
                <th>Stok</th>
                <th>Fiyat</th>
                <th>
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>
                      <strong>{p.name}</strong>
                    </Link>
                    <small>
                      {p.category?.name ?? "Kategorisiz"}
                      {p.featured ? " / Featured" : ""}
                    </small>
                  </td>
                  <td>
                    <span className={`status ${p.active ? "live" : ""}`}>
                      {p.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    {p.variants.reduce((sum, v) => sum + v.stock, 0)} adet
                    stokta
                    <small>{p.variants.length} varyant</small>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/admin/products/${p.id}`}
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>Henüz ürün eklenmedi</h2>
          <p>Mağazanızda görüntülemek için ilk ürününüzü ekleyin.</p>
          <Link className="button" href="/admin/products/new">
            Yeni Ürün
          </Link>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link href={`/admin/products?page=${page - 1}`}>Önceki</Link>
        )}
        {page * 30 < count && (
          <Link href={`/admin/products?page=${page + 1}`}>Sonraki</Link>
        )}
      </nav>
    </>
  );
}
