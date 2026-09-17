import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { fetchPropertyById } from "@/lib/propertiesServer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
  const exists = await fetchPropertyById(id);
  if (!exists) notFound();

  return <HomeView />;
}
