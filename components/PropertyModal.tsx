"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, Heart, BedDouble, Bath, Ruler, MapPin, Check } from "lucide-react";
import type { Property } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { useFav } from "./FavoritesProvider";
import { formatPrice, formatDate, whatsappLink, safeImages } from "@/lib/format";

interface Props {
  property: Property;
  onClose: () => void;
}

export default function PropertyModal({ property: p, onClose }: Props) {
  const { t, lang } = useLang();
  const { isFavorite, toggle, hydrated } = useFav();
  const fav = hydrated && isFavorite(p.id);
  const images = safeImages(p);

  // قفل سكرول الصفحة وإغلاق بـ Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const locationParts = [p.district, p.city, p.governorate].filter(Boolean);
  const locationText = lang === "en" ? locationParts.join(", ") : locationParts.join(" - ");

  const priceSuffix =
    p.listing_type === "rent"
      ? p.rent_period === "yearly"
        ? `/${t("yearly")}`
        : p.rent_period === "daily"
          ? `/${t("daily")}`
          : `/${t("monthly")}`
      : "";

  const isNew = Date.now() - new Date(p.created_at).getTime() < 3 * 86400000;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* النافذة — بوتوم شيت على الموبايل وبوب أب على الديسكتوب */}
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col slide-up-sheet sm:animate-none overflow-hidden shadow-2xl">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0 ${
                p.listing_type === "sale" ? "bg-[#1e3a8a]" : "bg-emerald-600"
              }`}
            >
              {p.listing_type === "sale" ? t("forSale") : t("forRent")}
            </span>
            {p.is_featured && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-amber-500 shrink-0">
                ⭐ {t("featured")}
              </span>
            )}
            {isNew && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-500 shrink-0">
                {t("new")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggle(p.id)}
              aria-label={fav ? t("removeFavorite") : t("addFavorite")}
              className="p-2.5 rounded-full hover:bg-slate-100"
            >
              <Heart size={20} className={fav ? "fill-rose-500 text-rose-500" : "text-slate-500"} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2.5 rounded-full hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto">
          {/* صورة كبيرة */}
          <div className="relative aspect-[16/10] bg-slate-100">
            <Image
              src={images[0]}
              alt={p.title}
              fill
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover"
            />
          </div>

          {/* باقي الصور */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
              {images.slice(1, 6).map((img, i) => (
                <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0">
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* العنوان والسعر */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{p.title}</h2>
              <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
                <MapPin size={15} className="text-[#1e3a8a] shrink-0" />
                {locationText}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#1e3a8a]">
                  {formatPrice(p.price)} <span className="text-sm">{t("egp")}</span>
                </span>
                <span className="text-xs text-slate-500 font-semibold">{priceSuffix}</span>
              </div>
            </div>

            {/* المواصفات */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <BedDouble className="mx-auto text-[#1e3a8a]" size={18} />
                <p className="font-extrabold text-slate-800 mt-1">{p.bedrooms || "-"}</p>
                <p className="text-[11px] text-slate-400 font-bold">{t("bedrooms")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Bath className="mx-auto text-[#1e3a8a]" size={18} />
                <p className="font-extrabold text-slate-800 mt-1">{p.bathrooms || "-"}</p>
                <p className="text-[11px] text-slate-400 font-bold">{t("bathrooms")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Ruler className="mx-auto text-[#1e3a8a]" size={18} />
                <p className="font-extrabold text-slate-800 mt-1">{p.area}</p>
                <p className="text-[11px] text-slate-400 font-bold">
                  {lang === "ar" ? "المساحة م²" : "Area m²"}
                </p>
              </div>
            </div>

            {/* الوصف */}
            {p.description && (
              <div>
                <h3 className="font-bold text-slate-700 text-sm mb-1">{t("description")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}

            {/* المميزات */}
            {p.features?.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-700 text-sm mb-2">{t("features")}</h3>
                <div className="flex flex-wrap gap-2">
                  {p.features.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5 font-semibold"
                    >
                      <Check size={13} className="text-emerald-600" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              {t("publishedOn")} {formatDate(p.created_at, lang)}
            </p>
          </div>
        </div>

        {/* أزرار التواصل الثابتة */}
        <div className="shrink-0 border-t border-slate-100 p-3 flex gap-2 bg-white">
          <a
            href={whatsappLink(p.contact_phone || "01151707244", p)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center text-sm active:scale-95 transition-transform"
          >
            💬 {t("whatsapp")}
          </a>
          <a
            href={`tel:${p.contact_phone || "01151707244"}`}
            className="flex-1 py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-center text-sm active:scale-95 transition-transform"
          >
            📞 {t("callNow")}
          </a>
        </div>
      </div>
    </div>
  );
}
