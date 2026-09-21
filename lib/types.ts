export type ListingType = "sale" | "rent";
export type RentPeriod = "monthly" | "yearly" | "daily";

export interface Property {
  id: string;
  created_at: string;
  listing_type: ListingType;
  rent_period: RentPeriod | null;
  property_type: string;
  title: string;
  description: string;
  price: number;
  governorate: string;
  city: string;
  district: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  images: string[];
  video?: string | null;
  negotiable?: boolean;
  contact_phone: string;
  is_featured: boolean;
  is_published: boolean;
}

export interface Filters {
  q: string;
  listing_type: ListingType | "";
  property_type: string;
  governorate: string;
  city: string;
  district: string;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  maxArea: number | null;
  bedrooms: number | null; // "3+" يعني 3 أو أكثر
  bathrooms: number | null; // "2+" يعني 2 أو أكثر
  sort: SortOption;
}

export type SortOption = "newest" | "price_desc" | "price_asc" | "area_desc";

export const emptyFilters: Filters = {
  q: "",
  listing_type: "",
  property_type: "",
  governorate: "",
  city: "",
  district: "",
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  bedrooms: null,
  bathrooms: null,
  sort: "newest",
};

/** عدد الفلاتر المفعّلة (لعرضها على زرار الفلتر) */
export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.q) n++;
  if (f.listing_type) n++;
  if (f.property_type) n++;
  if (f.governorate) n++;
  if (f.city) n++;
  if (f.district) n++;
  if (f.minPrice !== null) n++;
  if (f.maxPrice !== null) n++;
  if (f.minArea !== null) n++;
  if (f.maxArea !== null) n++;
  if (f.bedrooms !== null) n++;
  if (f.bathrooms !== null) n++;
  return n;
}
