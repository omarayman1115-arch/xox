import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * صفحة /properties — الـ SearchAction في JSON-LD بيقول لجوجل إن البحث بيحصل هنا.
 * البحث الفعلي على الرئيسية، فبنحوّل أي طلب (مع الـ q) لها عشان مايبقاش 404.
 */
export const metadata: Metadata = {
  title: "العقارات",
  robots: { index: false, follow: true },
};

export default function PropertiesPage() {
  redirect("/");
}
