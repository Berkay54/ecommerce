import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth-user";
import { ReviewForm } from "@/components/review-form";
import { orderDate } from "@/lib/order-display";
export async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const aggregate = await prisma.review.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  const user = await currentUser();
  const eligible = user
    ? await prisma.orderItem.findFirst({
        where: {
          productId,
          order: {
            userId: user.id,
            status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
            OR: [
              { payment: { is: null } },
              { payment: { status: "SUCCEEDED" } },
            ],
          },
        },
        select: { id: true },
      })
    : null;
  const own = user
    ? await prisma.review.findUnique({
        where: { userId_productId: { userId: user.id, productId } },
      })
    : null;
  return (
    <section
      className="product-reviews home-section"
      aria-labelledby="reviews-title"
    >
      <div className="section-heading">
        <h2 id="reviews-title">Müşteri Değerlendirmeleri</h2>
        <span>
          {aggregate._count
            ? `${aggregate._avg.rating?.toFixed(1).replace(".", ",")} / 5 · ${aggregate._count} yorum`
            : "Henüz yorum yok"}
        </span>
      </div>
      <p className="muted">
        Yalnızca satın alan müşterilerin onaylanmış yorumları yayımlanır. En
        yeni 30 değerlendirme gösterilir.
      </p>
      <div className="review-layout">
        <div>
          {reviews.length ? (
            reviews.map((review) => (
              <article className="panel" key={review.id}>
                <p>
                  <strong>
                    {review.user.name?.split(" ")[0] || "Müşteri"}
                  </strong>{" "}
                  · Doğrulanmış alışveriş
                </p>
                <span aria-label={`${review.rating} / 5 puan`}>
                  {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                </span>
                <p className="review-comment">{review.comment}</p>
                <small className="muted">{orderDate(review.createdAt)}</small>
              </article>
            ))
          ) : (
            <div className="empty compact-empty">
              <h3>İlk değerlendirme sizden gelsin</h3>
              <p>Ürünü satın aldıktan sonra deneyiminizi paylaşabilirsiniz.</p>
            </div>
          )}
        </div>
        {eligible ? (
          <ReviewForm
            productId={productId}
            rating={own?.rating}
            comment={own?.comment}
          />
        ) : (
          <div className="panel">
            <h3>Deneyiminiz değerli</h3>
            <p>
              Değerlendirme yazabilmek için bu ürünü satın almış olmanız
              gerekir.
            </p>
            {!user && (
              <Link href="/giris" className="text-link">
                Giriş Yap
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
