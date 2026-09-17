import type { MetadataRoute } from "next";
import { fetchAllProperties } from "@/lib/propertiesServer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/admin`, changeFrequency: "yearly" as const, priority: 0.1 },
  ];

  const properties = await fetchAllProperties().catch(() => []);
  const propertyPages: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${siteUrl}/properties/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...propertyPages];
}
