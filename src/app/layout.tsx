import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Form & Field · Online Alışveriş",
  description:
    "Yeni sezon ürünlerini, kategorileri ve koleksiyonu Form & Field'da keşfedin.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
