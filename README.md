# Form & Field

A PostgreSQL-backed catalogue built with Next.js 16, React 19, TypeScript, Tailwind 4 and Prisma 7.10.1.

## Run on Windows

Keep the existing `DATABASE_URL` in `.env`, pointing at the already migrated database. No schema changes or migrations are needed.

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run dev
```

Visit `/admin` to manage products and `/admin/categories` to create categories. The storefront is at `/`, `/products`, and `/products/[slug]`. Categories are selected with `/products?category=category-slug`.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd start
```

The build automatically generates Prisma Client using `prisma7.config.ts`. For future Prisma CLI commands, always supply `--config prisma7.config.ts`; the custom filename is deliberately preserved.

## Catalogue behaviour

- The existing Product, ProductImage, ProductVariant and Category models are used directly. No separate data store or mock catalogue exists.
- A server-only Prisma singleton uses the PostgreSQL driver adapter and respects the URL's `schema` parameter.
- SKU and stock live on variants. The editor supports multiple variants and preserves existing variant-specific prices. Existing variants cannot be removed through the editor, avoiding loss of inventory referenced by orders or carts.
- Prices use the existing Decimal fields, validated as decimal strings with two-place precision. The interface currently displays USD; the schema has no currency field.
- Every storefront query reads current database data at request time. Successful mutations invalidate route data. Only active products are public; featured products appear first on the homepage.
- Product writes and image/variant updates are transactional. Duplicate SKUs/slugs, invalid categories, validation failures and database failures produce readable messages. Validation errors preserve product form values.
- Deletion requires confirmation. Database foreign keys prevent deleting a product referenced by a cart or order; make that product inactive instead.
- Image URLs use HTTP(S), one per line, with a maximum of 20. They are loaded directly by the browser without the Next.js image proxy. Missing images have a neutral placeholder.
- Pagination limits product lists to 24 storefront items or 30 admin items per page.
- No authentication, cart checkout or payment flow is implemented. Admin routes and write actions are publicly accessible, as requested for this stage.

## Verification

Production build, TypeScript and ESLint pass. Browser checks against PostgreSQL covered product creation, immediate storefront visibility, detail rendering, compare-price validation with form preservation, updating price, hiding inactive products, and confirmed deletion. The temporary verification product was removed. A 390px viewport check found no homepage horizontal overflow.
