import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { fetchPropertyById } from "@/lib/propertiesServer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Props {
  params: Promise<{ id: string }>;
}

/** صفحة العقار المباشرة — للواتساب وجوجل: تعرض الرئيسية والنافذة مفتوحة */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchPropertyById(id);
  if (!p) return { title: "عقار غير موجود" };

  const title = `${p.title} — ${p.price.toLocaleString("en-US")} ج.م`;
  const desc = `${p.property_type} ${p.area}م في ${p.city} ${p.governorate} — ${p.bedrooms} غرف، ${p.bathrooms} حمامات. ${p.description}`.slice(0, 300);

  return {
    title,
    description: desc,
    alternates: { canonical: `/properties/${p.id}` },
    openGraph: {
      title,
      description: desc,
      images: p.images?.length ? [{ url: p.images[0] }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: p.images?.length ? [p.images[0]] : undefined,
    },
  };
}

export default async function PropertyDirectPage({ params }: Props) {
  const { id } = await params;
  const p = await fetchPropertyById(id);
  if (!p) notFound();

  const siteOrigin = siteUrl.replace(/\/$/, "");
  const priceValid = Number.isFinite(p.price) && p.price > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${siteOrigin}/properties/${p.id}`,
    name: p.title,
    url: `${siteOrigin}/properties/${p.id}`,
    description:
      `${p.property_type} ${p.area}م في ${p.city} ${p.governorate} — ${p.bedrooms} غرف، ${p.bathrooms} حمامات. ${p.description}`.slice(
        0,
        5000
      ),
    datePosted: p.created_at,
    image: p.images?.length ? p.images : undefined,
    ...(priceValid
      ? {
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "EGP",
            availability: "https://schema.org/InStock",
            url: `${siteOrigin}/properties/${p.id}`,
          },
        }
      : {}),
    numberOfRooms: p.bedrooms || undefined,
    numberOfBathroomsTotal: p.bathrooms || undefined,
    floorSize: p.area
      ? { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" }
      : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: p.city || p.governorate,
      addressRegion: p.governorate,
      addressCountry: "EG",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeView />
    </>
  );
}
