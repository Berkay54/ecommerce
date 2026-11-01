import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ReviewModeration } from "@/components/review-form";
export default function Reviews() {
  return (
    <Suspense fallback={<p>Yorumlar yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await requireAdmin();
  await connection();
  const reviews = await prisma.review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    take: 100,
  });
  return (
    <>
      <h1>Müşteri Yorumları</h1>
      <p className="muted">
        Önce onay bekleyenler gösterilir. En son 100 kayıt listelenir.
      </p>
      {!reviews.length && (
        <div className="empty">
          <h2>Henüz yorum yok</h2>
        </div>
      )}
      {reviews.map((review) => (
        <article className="panel" key={review.id}>
          <p className="status">
            {review.approved ? "Yayında" : "Onay bekliyor"}
          </p>
          <h2>{review.product.name}</h2>
          <p>
            {review.user.name} · {review.user.email} · {review.rating}/5
          </p>
          <p className="review-comment">{review.comment}</p>
          <Link className="text-link" href={`/products/${review.product.slug}`}>
            Ürünü Gör →
          </Link>
          <ReviewModeration
            key={`${review.id}-${review.approved}`}
            id={review.id}
            approved={review.approved}
            rating={review.rating}
            comment={review.comment}
          />
        </article>
      ))}
    </>
  );
}
