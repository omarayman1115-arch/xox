"use client";

import { useCallback, useEffect, useState } from "react";
import type { Property, Filters, SortOption } from "./types";
import { emptyFilters } from "./types";
import { MOCK_PROPERTIES } from "./mockData";
import { getSupabase, PROPERTIES_TABLE } from "./supabase";

/** تطبيق الفلاتر والفرز على قائمة عقارات */
export function applyFilters(list: Property[], f: Filters): Property[] {
  let out = list.filter((p) => {
    if (p.is_published === false) return false;
    if (f.listing_type && p.listing_type !== f.listing_type) return false;
    if (f.property_type && p.property_type !== f.property_type) return false;
    if (f.governorate && p.governorate !== f.governorate) return false;
    if (f.city && p.city !== f.city) return false;
    if (f.district && p.district !== f.district) return false;
    if (f.minPrice !== null && p.price < f.minPrice) return false;
    if (f.maxPrice !== null && p.price > f.maxPrice) return false;
    if (f.minArea !== null && p.area < f.minArea) return false;
    if (f.maxArea !== null && p.area > f.maxArea) return false;
    if (f.bedrooms !== null && p.bedrooms < f.bedrooms) return false;
    if (f.bathrooms !== null && p.bathrooms < f.bathrooms) return false;
    if (f.q) {
      const hay = `${p.title} ${p.description} ${p.governorate} ${p.city} ${p.district} ${p.property_type}`.toLowerCase();
      if (!hay.includes(f.q.toLowerCase())) return false;
    }
    return true;
  });

  const sorters: Record<SortOption, (a: Property, b: Property) => number> = {
    newest: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    price_desc: (a, b) => b.price - a.price,
    price_asc: (a, b) => a.price - b.price,
    area_desc: (a, b) => b.area - a.area,
  };
  out = [...out].sort(sorters[f.sort]);
  return out;
}

/** جلب العقارات من Supabase أو البيانات التجريبية */
export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from(PROPERTIES_TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setProperties(data as Property[]);
      } else {
        setProperties([]);
      }
    } else {
      // وضع البيانات التجريبية — محاكاة تأخير شبكة خفيف
      await new Promise((r) => setTimeout(r, 250));
      setProperties(MOCK_PROPERTIES);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { properties, loading, refetch };
}

export { emptyFilters };
