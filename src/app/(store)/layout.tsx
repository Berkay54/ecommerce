import Link from "next/link";
import { StoreHeader } from "@/components/catalog";
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreHeader />
      {children}
      <footer className="wrap footer">
        <span className="brand">
          FORM<span>&</span>FIELD
        </span>
        <p>Considered objects. Everyday living.</p>
        <Link href="/products">Explore the collection</Link>
      </footer>
    </>
  );
}
