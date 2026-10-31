import { Prisma } from "@prisma/client";
export const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { id: "asc" as const } },
} satisfies Prisma.ProductInclude;
export type CatalogProduct = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;
export function money(value: { toString(): string } | string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value.toString()));
}
