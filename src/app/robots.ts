import type { MetadataRoute } from "next";
import { publicIndexing, siteOrigin } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return publicIndexing()
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin",
            "/api",
            "/hesabim",
            "/checkout",
            "/cart",
            "/orders",
            "/odeme",
            "/giris",
            "/kayit",
          ],
        },
        sitemap: `${siteOrigin()}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
