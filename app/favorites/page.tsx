import type { Metadata } from "next";
import { redirect } from "next/navigation";

/** صفحة المفضلة الحقيقية على /?fav=1 — هنا بنحوّل أي حد كتب /favorites يدوياً */
export const metadata: Metadata = {
  title: "المفضلة",
  robots: { index: false, follow: true },
};

export default function FavoritesPage() {
  redirect("/?fav=1");
}
