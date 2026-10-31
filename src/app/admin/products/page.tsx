import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { productInclude, money } from "@/lib/catalog";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; page?: string }>;
}) {
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
          <p className="eyebrow">Your studio / Catalogue</p>
          <h1>Products</h1>
          <p className="muted">
            Shape the collection, one considered detail at a time.
          </p>
        </div>
        <Link className="button" href="/admin/products/new">
          + New product
        </Link>
      </div>
      {(query.saved || query.deleted) && (
        <p role="status" className="notice">
          {query.saved
            ? "Product saved. Your storefront is up to date."
            : "Product deleted."}
        </p>
      )}
      <div className="stats">
        <div>
          <span>{count}</span>Total products
        </div>
        <div>
          <span>{active}</span>Published
        </div>
        <div>
          <span>{featured}</span>Featured
        </div>
      </div>
      {products.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Inventory</th>
                <th>Price</th>
                <th>
                  <span className="sr-only">Actions</span>
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
                      {p.category?.name ?? "Uncategorized"}
                      {p.featured ? " / Featured" : ""}
                    </small>
                  </td>
                  <td>
                    <span className={`status ${p.active ? "live" : ""}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {p.variants.reduce((sum, v) => sum + v.stock, 0)} in stock
                    <small>{p.variants.length} variant(s)</small>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/admin/products/${p.id}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>Your collection starts here.</h2>
          <p>Add your first product to bring the storefront to life.</p>
          <Link className="button" href="/admin/products/new">
            Create a product
          </Link>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link href={`/admin/products?page=${page - 1}`}>Previous</Link>
        )}
        {page * 30 < count && (
          <Link href={`/admin/products?page=${page + 1}`}>Next</Link>
        )}
      </nav>
    </>
  );
}
