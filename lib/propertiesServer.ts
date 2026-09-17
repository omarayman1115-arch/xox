import type { Property } from "./types";
import { MOCK_PROPERTIES } from "./mockData";
import { getSupabase, PROPERTIES_TABLE } from "./supabase";

/** جلب عقار واحد بالـ id — آمنة للسيرفر (تُستخدم في صفحة التفاصيل والـ sitemap) */
export async function fetchPropertyById(id: string): Promise<Property | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from(PROPERTIES_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Property) ?? null;
  }
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}

/** كل العقارات (سيرفر) — تُستخدم في الـ sitemap */
export async function fetchAllProperties(): Promise<Property[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from(PROPERTIES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    return (data as Property[]) ?? [];
  }
  return MOCK_PROPERTIES;
}
