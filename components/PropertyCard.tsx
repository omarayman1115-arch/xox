"use client";

import Image from "next/image";
import { BedDouble, Bath, Ruler, Heart, MapPin, Video } from "lucide-react";
import type { Property } from "@/lib/types";
import { useLang, usePropertyTypeLabel } from "@/lib/i18n";
import { useFav } from "./FavoritesProvider";
import { formatPrice, coverImage } from "@/lib/format";

interface CardProps {
  property: Property;
  onOpen?: (p: Property) => void;
  /** الصور الأولى اللي فوق — بتتحمل بأولوية عشان سرعة الظهور */
  priority?: boolean;
}

export default function PropertyCard({ property, onOpen, priority = false }: CardProps) {
  const { t, lang } = useLang();
  const typeLabel = usePropertyTypeLabel();
  const { isFavorite, toggle, hydrated } = useFav();
  const fav = hydrated && isFavorite(property.id);

  const isNew =
    Date.now() - new Date(property.created_at).getTime() < 3 * 86400000;

  const locationParts = [property.city, property.governorate].filter(Boolean);
  const locationText =
    lang === "en"
      ? locationParts.join(", ")
      : locationParts.join(" - ");

  const priceSuffix =
    property.listing_type === "rent"
      ? property.rent_period === "yearly"
        ? `/${t("yearly")}`
        : property.rent_period === "daily"
          ? `/${t("daily")}`
          : `/${t("monthly")}`
      : "";

  return (
    <div className="group bg-surface rounded-2xl overflow-hidden border border-slate-200 hover:border-accent/40 transition-[border-color,box-shadow] duration-300 hover:shadow-lg hover:shadow-black/30 fade-up">
      {/* الصورة */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <button
          type="button"
          onClick={() => (onOpen ? onOpen(property) : (window.location.href = `/properties/${property.id}`))}
          className="block w-full cursor-pointer"
          aria-label={property.title}
        >
          <span className="block relative aspect-[4/3]">
            <Image
              src={coverImage(property)}
              alt={property.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover card-img"
            />
          </span>
        </button>

        {/* الشارات */}
        <div className="absolute top-3 start-3 flex gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${
              property.listing_type === "sale" ? "bg-accent-deep" : "bg-emerald-500"
            }`}
          >
            {property.listing_type === "sale" ? t("forSale") : t("forRent")}
          </span>
          {property.is_featured && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-amber-500">
              ⭐ {t("featured")}
            </span>
          )}
          {isNew && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-500">
              {t("new")}
            </span>
          )}
        </div>

        {/* شارة الفيديو */}
        {property.video && (
          <span className="absolute bottom-3 end-3 px-2 py-1 rounded-lg bg-black/60 text-white text-xs backdrop-blur flex items-center gap-1">
            <Video size={12} />
          </span>
        )}

        {/* القلب */}
        <button
          onClick={() => toggle(property.id)}
          aria-label={fav ? t("removeFavorite") : t("addFavorite")}
          className="absolute top-3 end-3 w-9 h-9 rounded-full bg-surface-2/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-transform"
        >
          <Heart
            size={18}
            className={fav ? "fill-rose-500 text-rose-500" : "text-slate-500"}
          />
        </button>
      </div>

      {/* التفاصيل */}
      <button
        type="button"
        onClick={() => (onOpen ? onOpen(property) : (window.location.href = `/properties/${property.id}`))}
        className="block w-full text-start p-4 cursor-pointer"
      >
        <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-accent transition-colors">
          {property.title}
        </h3>

        <p className="flex items-center gap-1 text-sm text-slate-500 mt-1.5">
          <MapPin size={14} className="shrink-0" />
          <span className="line-clamp-1">{locationText}</span>
        </p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-accent">
            {formatPrice(property.price)}{" "}
            <span className="text-sm font-bold">{t("egp")}</span>
          </span>
          <span className="text-xs text-slate-500">{priceSuffix}</span>
          {property.negotiable && (
            <span className="ms-auto px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
              {t("negotiableBadge")}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-4 text-xs text-slate-600 font-semibold">
          <span className="flex items-center gap-1">
            <BedDouble size={15} className="text-accent" />
            {property.bedrooms > 0 ? property.bedrooms : "-"}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={15} className="text-accent" />
            {property.bathrooms > 0 ? property.bathrooms : "-"}
          </span>
          <span className="flex items-center gap-1">
            <Ruler size={15} className="text-accent" />
            {property.area} {lang === "ar" ? "م²" : "m²"}
          </span>
          <span className="ms-auto truncate max-w-24 text-slate-400">
            {typeLabel(property.property_type)}
          </span>
        </div>
      </button>
    </div>
  );
}
