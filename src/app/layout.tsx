import type { Metadata } from "next";
import "./globals.css";
import "./home-editorial.css";
import { BRAND_NAME } from "@/lib/brand";
import { publicIndexing, siteOrigin } from "@/lib/site";
export const metadata: Metadata = {
  title: `${BRAND_NAME} · Çevrim İçi Alışveriş`,
  description: `Yeni sezon ürünleri, kategoriler ve özenle seçilmiş koleksiyonlar: ${BRAND_NAME}.`,
  metadataBase: siteOrigin() ? new URL(siteOrigin()!) : undefined,
  robots: publicIndexing()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
