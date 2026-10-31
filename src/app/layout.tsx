import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Form & Field · Considered everyday",
  description:
    "Explore the Form & Field collection. Considered objects for everyday living.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
