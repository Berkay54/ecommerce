# Form & Field

Türkçe mağaza ve yönetim arayüzü için [Tasarım Raporu](./TASARIM-RAPORU.md), üyelik/adres için [Hesap ve Sipariş Raporu](./HESAP-SIPARIS-RAPORU.md), güncel ödeme ve stok davranışı için [iyzico Sandbox Raporu](./IYZICO-SANDBOX-RAPORU.md) dosyasına bakın. Arayüz TL (`tr-TR` / `TRY`) kullanır. Üyelik ve sipariş yönetimi etkindir; ödeme yalnızca iyzico sandbox ortamındadır. Production ödeme, kargo, kupon ve bülten entegrasyonları eklenmedi.

A PostgreSQL-backed catalogue built with Next.js 16, React 19, TypeScript, Tailwind 4 and Prisma 7.10.1.

## Run on Windows

Keep the existing `DATABASE_URL` in `.env`. Apply the additive customer/order migration before starting another environment. Configure a strong, stable `AUTH_SECRET` in ignored `.env.local` locally and Vercel environment variables in production.

```powershell
npm.cmd install
npx.cmd prisma migrate deploy --config prisma7.config.ts
npm.cmd run db:generate
npm.cmd run dev
```

Register at `/kayit` and sign in at `/giris`. Account, addresses and orders are under `/hesabim`; checkout is at `/checkout`. Admin routes require ADMIN, including product/category CRUD, image uploads and `/admin/orders`. To grant the first administrator role to an existing real account, run `npm.cmd run admin:promote -- real-account-email`; this never creates a user. The storefront is at `/`, `/products`, and `/products/[slug]`. Categories are selected with `/products?category=category-slug`.

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
- Prices use the existing Decimal fields, validated as decimal strings with two-place precision. The interface displays TRY; the schema has no currency field.
- Every storefront query reads current database data at request time. Successful mutations invalidate route data. Only active products are public; featured products appear first on the homepage.
- Product writes and image/variant updates are transactional. Duplicate SKUs/slugs, invalid categories, validation failures and database failures produce readable messages. Validation errors preserve product form values.
- Deletion requires confirmation. Database foreign keys prevent deleting a product referenced by a cart or order; make that product inactive instead.
- Photography is managed in the existing product editor: upload multiple files, edit alt text, move images earlier/later, and remove images. The first image is the cover. Existing HTTP(S) image URLs remain supported. Images load directly without the Next.js image proxy.
- Pagination limits product lists to 24 storefront items or 30 admin items per page.
- Guest shopping bags are available through the header drawer and `/cart`. Checkout requires authentication and creates PENDING orders without reserving/decrementing stock. Only a server-verified iyzico sandbox payment decrements stock and marks PAID in one transaction. Paid-but-unfulfillable results enter REVIEW for operator attention. Admin pages, write actions and image APIs require ADMIN. Production payments and shipping integrations remain deferred.

## iyzico sandbox setup

Add your own `IYZIPAY_API_KEY`, `IYZIPAY_SECRET_KEY`, `IYZIPAY_URI=https://sandbox-api.iyzipay.com` and `NEXT_PUBLIC_APP_URL` to ignored `.env.local` / deployment environment variables. See `.env.example` for placeholders. Keep credentials server-side. The checkout form is hosted by iyzico; no card number/CVC is handled or stored by this application. The missing identity number is collected transiently during checkout, sent to iyzico and never stored in PostgreSQL.

Use `http://localhost:3000` for local setup; actual sandbox callback testing needs an accessible HTTPS application/tunnel URL with valid SSL. Callback path: `/api/payments/iyzico/callback`. Production API hosts are rejected. Apply the additive `20261101020000_iyzico_sandbox` migration with the existing config before starting another environment. Full setup, stock/idempotency decisions and test limitations are in the [sandbox report](./IYZICO-SANDBOX-RAPORU.md).

## Product image storage (Vercel Blob)

1. In the Vercel project, open **Storage**, create/connect a **public Blob store**, and connect it to the environments you deploy to.
2. Vercel supplies `BLOB_READ_WRITE_TOKEN`. For this PC, put it in the ignored `.env.local` file:

   ```dotenv
   BLOB_READ_WRITE_TOKEN=your-store-read-write-token
   ```

3. Restart `npm.cmd run dev` after changing local environment variables. Redeploy after configuring Vercel environment variables. Never expose the token as a `NEXT_PUBLIC_` variable.
4. In `/admin/products/new` or an existing editor, choose files, inspect previews, and click **Upload selected images**. Upload errors keep the preview and other form values so you can retry. Upload or remove all pending files before saving.

The implementation uses [Vercel Blob server uploads](https://vercel.com/docs/vercel-blob/server-upload). Each request carries one file, limited to **3 MiB**, within Vercel's 4.5 MB function request limit. JPEG, PNG and WebP files are checked on both client and server. Sharp verifies the actual file format, fully decodes it, rejects animated/oversized images (40 megapixels maximum), applies orientation, removes metadata and stores WebP. Files are placed under `ecommerce/products/` with random names. PostgreSQL stores only the existing ProductImage URL, alt text and sortOrder fields; no schema change or migration is needed.

Removing an existing image stages its removal until **Save product**. After the database transaction succeeds, unused managed Blob files are deleted. External URLs are never deleted from their remote hosts; shared URLs still referenced by another product are retained. Deleting a product also cleans up its managed images after a successful database deletion. Removing a newly uploaded, unsaved image deletes it immediately. A failed storage deletion leaves the image available for retry, or displays a cleanup warning after saving rather than rolling back successful product changes.

If an editor tab is abandoned after upload, its unsaved files can remain in Blob. Periodically remove unreferenced `ecommerce/products/` files from the Blob dashboard, comparing their URLs with ProductImage records. No browser-unload cleanup is attempted because it could delete files during a successful save. Upload/delete endpoints require the same browser origin and an authenticated ADMIN.

## Guest bag persistence and inventory

- The bag uses localStorage under `form-field:guest-cart:v1`. Only product ID, variant ID and quantity are persisted, so it survives refreshes and browser restarts on that browser/origin without users, cookies or guest database rows. The existing Cart schema requires a user and remains untouched.
- Server rendering and the first client render both start with an empty/loading bag. Browser storage is read only after mounting, avoiding hydration mismatches. Corrupt storage can be cleared; network/database failures retain saved input for retry. When browser storage is blocked, the UI reports that persistence is unavailable.
- `/api/cart` validates every addition and quantity update against PostgreSQL. It merges identical product/variant pairs, ignores browser-supplied prices, reads current variant prices (falling back to product price), caps quantities to current stock and removes deleted, inactive or unavailable selections with a notice.
- The bag revalidates on mount, window focus, drawer opening and every minute while the tab is visible. Changes synchronize across tabs via storage events. Mutations are queued to prevent overlapping requests from overwriting each other.
- Inventory lives exclusively on ProductVariant in this schema. A product without variants has no stock to sell and is unavailable. A selection is required even for a single variant. ProductVariant has no active flag: product.active, variant existence and positive stock determine availability.
- Quantity changes, remove, clear, header count, unit price, line total, subtotal, empty/error/loading states and keyboard-accessible drawer behavior share the same cart state. Amounts are calculated in integer cents. A bag and unpaid order do not reserve stock. Inventory decreases atomically only after the sandbox payment is verified; failed payments retain the bag and inventory.

## Verification

Run the checks on Windows:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Playwright runs the production server on port 3100. Tests cover input validation, stale cart reconciliation, malformed localStorage recovery, network failure/retry without data loss, the empty cart, drawer focus/Escape, desktop/mobile overflow, image file validation, pre-upload previews, ordering, alt text, removal and missing-storage errors. They do not create mock products or mutate catalog data. A populated-bag test uses an existing real product, checking required variants, merge behavior, quantity/stock limits, refresh, a full browser close/reopen, remove and clear. It is explicitly skipped if no real products or available variants exist. To target a particular real product:

```powershell
$env:E2E_PRODUCT_SLUG = "your-real-product-slug"
npm.cmd run test:e2e
```

Latest full verification on this PC (1 November 2026): TypeScript and production build passed; ESLint has 0 errors and 1 existing unused-import warning in `prisma7.config.ts`. Playwright completed with **19 passed, 12 skipped**. Real sandbox payment, stock deduction, duplicate callback and authenticated customer/admin flows remain unverified without sandbox credentials, real products and supplied account credentials. No mock users, products, orders or payments were created. See the [sandbox report](./IYZICO-SANDBOX-RAPORU.md) for test limits and opt-in settings. The current local Prisma instance is `ecommerce-home`; if stopped, start it with `npx.cmd prisma dev start ecommerce-home --config prisma7.config.ts`. Its data and migrations were preserved.

Real Blob upload and product-save verification require the Blob token and real product data. Finish this flow once those are configured:

1. Create/edit a real product in `/admin`; choose at least two images, upload, describe alt text, move the intended cover to first and save.
2. Reopen the editor to check saved order/alt text. Open `/products` and its product detail page to confirm the cover/gallery render.
3. Select a stocked variant and add it twice; open the bag and confirm a single merged line. Change quantity up to the stock limit, check subtotal, refresh and restart the browser.
4. Remove the item, add it again, and clear the bag. Verify an out-of-stock variant cannot be selected. Change the product's stock/active state in admin and return focus to the store to check stale-item reconciliation.
5. Remove a saved uploaded image and save; verify its ProductImage record and unreferenced Blob file are deleted. Confirm existing external image URLs still render.

No destructive database commands are required. Prisma remains 7.10.1 with `prisma7.config.ts` and the existing migration history.
