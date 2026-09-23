"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Heart, BedDouble, Bath, Ruler, MapPin, Check, MessageCircle, Phone, ChevronLeft, ChevronRight, Video, HandCoins, Share2, Copy } from "lucide-react";
import type { Property } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { useFav } from "./FavoritesProvider";
import { formatPrice, formatDate, whatsappLink, safeImages } from "@/lib/format";
import LeadModal from "./LeadModal";

interface Props {
  property: Property;
  onClose: () => void;
  /** باقي العقارات — لعقارات مشابهة */
  allProperties?: Property[];
  /** فتح عقار تاني من العقارات المشابهة */
  onOpenProperty?: (p: Property) => void;
}

export default function PropertyModal({ property: p, onClose, allProperties, onOpenProperty }: Props) {
  const { t, lang } = useLang();
  const { isFavorite, toggle, hydrated } = useFav();
  const fav = hydrated && isFavorite(p.id);
  const images = safeImages(p);
  const [copied, setCopied] = useState<"link" | "phone" | null>(null);

  // العقارات المشابهة: نفس النوع أو نفس المدينة — غير العقار الحالي، حد أقصى 3
  const similar = (allProperties ?? [])
    .filter((o) => o.id !== p.id && o.is_published !== false)
    .sort((a, b) => {
      const score = (x: Property) =>
        (x.property_type === p.property_type ? 2 : 0) + (x.city === p.city ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 3);

  /** مشاركة العقار — Web Share API لو متاح، وإلا نسخ الرابط */
  async function share() {
    const url = `${window.location.origin}/properties/${p.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* المستخدم لغى المشاركة — مفيش حاجة */
    }
  }

  /** نسخ رقم التليفون */
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied("phone");
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  // فورم التقاط بيانات العميل قبل واتساب — يقدر يتقفل بمتغير البيئة NEXT_PUBLIC_LEAD_FORM=off
  const showLeadForm = process.env.NEXT_PUBLIC_LEAD_FORM !== "off";
  const [leadOpen, setLeadOpen] = useState(false);

  // المعرض: الصورة المعروضة — بتترجع للأولى لما يتغير العقار
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [p.id]);

  // التنقل بالأسهم — بيقف عند الأول والآخر (من غير لف حوالين)
  const nextImg = () => setImgIdx((i) => Math.min(i + 1, images.length - 1));
  const prevImg = () => setImgIdx((i) => Math.max(i - 1, 0));

  // سحب باللمس (swipe) للتنقل بين الصور على الموبايل
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return; // سحب قصير — تجاهل
    // عربي (RTL): سحب لليمين = الصورة التالية، وسحب لليسار = السابقة
    if (lang === "ar") {
      dx > 0 ? prevImg() : nextImg();
    } else {
      dx > 0 ? nextImg() : prevImg();
    }
  };

  // قفل سكرول الصفحة وإغلاق بـ Escape + تنقل بالأسهم
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (images.length > 1) {
        // الكيبورد يتبع اتجاه الصفحة: عربي (شمال = التالية) وإنجليزي (يمين = التالية)
        if (lang === "ar") {
          if (e.key === "ArrowLeft") nextImg();
          if (e.key === "ArrowRight") prevImg();
        } else {
          if (e.key === "ArrowRight") nextImg();
          if (e.key === "ArrowLeft") prevImg();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, images.length]);

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

  const phone = p.contact_phone || "01556956343";
  const wa = whatsappLink(phone, p);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* النافذة — بوتوم شيت على الموبايل وبوب أب على الديسكتوب */}
      <div className="relative bg-surface w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col slide-up-sheet sm:animate-none overflow-hidden shadow-2xl">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0 ${
                p.listing_type === "sale" ? "bg-accent-deep" : "bg-emerald-500"
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
            {p.video && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-500 shrink-0 flex items-center gap-1">
                <Video size={12} /> فيديو
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
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* صورة كبيرة — بتتغير لما تدوس على صورة من المصغرات + سحب باللمس */}
          <div
            className="relative aspect-[16/10] bg-ink"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              key={images[imgIdx]}
              src={images[imgIdx]}
              alt={`${p.title} — صورة ${imgIdx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover"
              priority
            />
            {/* عدّاد الصور — dir=ltr عشان رقم الصورة يفضل على الشمال مش يتقلب مع RTL */}
            {images.length > 1 && (
              <span dir="ltr" className="absolute bottom-3 end-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-bold backdrop-blur">
                {imgIdx + 1} / {images.length}
              </span>
            )}
            {/* أسهم التنقل — بتتقلب مع اتجاه الصفحة، وبتختفي عند أول/آخر صورة */}
            {images.length > 1 && imgIdx < images.length - 1 && (
              <button
                type="button"
                onClick={nextImg}
                aria-label={lang === "ar" ? "الصورة التالية" : "Next image"}
                className="absolute top-1/2 -translate-y-1/2 end-3 w-9 h-9 rounded-full bg-surface-2/90 hover:bg-surface-2 text-slate-800 shadow-md backdrop-blur flex items-center justify-center active:scale-95 transition-[transform,background-color]"
              >
                {lang === "ar" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
            {images.length > 1 && imgIdx > 0 && (
              <button
                type="button"
                onClick={prevImg}
                aria-label={lang === "ar" ? "الصورة السابقة" : "Previous image"}
                className="absolute top-1/2 -translate-y-1/2 start-3 w-9 h-9 rounded-full bg-surface-2/90 hover:bg-surface-2 text-slate-800 shadow-md backdrop-blur flex items-center justify-center active:scale-95 transition-[transform,background-color]"
              >
                {lang === "ar" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
          </div>

          {/* مشغل الفيديو — تحت الصور لو فيه فيديو */}
          {p.video && (
            <div className="px-4 pt-3">
              <video
                src={p.video}
                controls
                preload="metadata"
                playsInline
                className="w-full rounded-xl border border-slate-200 bg-black"
              />
            </div>
          )}

          {/* المصغرات — كلها قابلة للضغط والصورة المختارة عليها إطار */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  aria-label={`عرض الصورة ${i + 1}`}
                  className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 transition-[opacity,box-shadow] ${
                    i === imgIdx
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* العنوان والسعر */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{p.title}</h2>
              <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
                <MapPin size={15} className="text-accent shrink-0" />
                {locationText}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-accent">
                  {formatPrice(p.price)} <span className="text-sm">{t("egp")}</span>
                </span>
                <span className="text-xs text-slate-500 font-semibold">{priceSuffix}</span>
                {p.negotiable && (
                  <span className="ms-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0">
                    <HandCoins size={13} />
                    {t("negotiableBadge")}
                  </span>
                )}
              </div>
            </div>

            {/* المواصفات */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <BedDouble className="mx-auto text-accent" size={18} />
                <p className="font-extrabold text-slate-800 mt-1">{p.bedrooms || "-"}</p>
                <p className="text-[11px] text-slate-400 font-bold">{t("bedrooms")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Bath className="mx-auto text-accent" size={18} />
                <p className="font-extrabold text-slate-800 mt-1">{p.bathrooms || "-"}</p>
                <p className="text-[11px] text-slate-400 font-bold">{t("bathrooms")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Ruler className="mx-auto text-accent" size={18} />
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
                      className="flex items-center gap-1.5 text-xs text-slate-700 bg-ink rounded-lg px-2.5 py-1.5 font-semibold"
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

          {/* عقارات مشابهة — نفس النوع أو نفس المدينة */}
          {similar.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="font-bold text-slate-700 text-sm mb-2">{t("similarProperties")}</h3>
              <div className="grid grid-cols-3 gap-2">
                {similar.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpenProperty?.(s)}
                    className="text-start rounded-xl border border-slate-200 overflow-hidden hover:border-accent/50 transition-colors bg-surface"
                  >
                    <div className="relative aspect-[4/3] bg-ink">
                      <Image
                        src={safeImages(s)[0]}
                        alt=""
                        fill
                        sizes="140px"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-1">{s.title}</p>
                      <p className="text-[11px] font-extrabold text-accent mt-0.5">
                        {formatPrice(s.price)} {t("egp")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* أزرار التواصل الثابتة */}
        <div className="shrink-0 border-t border-slate-200 p-3 bg-surface">
          <div className="flex gap-2">
            {showLeadForm ? (
              <button
                onClick={() => setLeadOpen(true)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center text-sm active:scale-95 transition-transform"
              >
                💬 {t("whatsapp")}
              </button>
            ) : (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center text-sm active:scale-95 transition-transform"
              >
                💬 {t("whatsapp")}
              </a>
            )}
            <a
              href={`tel:${phone}`}
              className="flex-1 py-3 rounded-xl bg-accent-deep hover:bg-accent-hover text-white font-bold text-center text-sm active:scale-95 transition-transform"
            >
              📞 {t("callNow")}
            </a>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={share}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-surface-2 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Share2 size={13} />
              {copied === "link" ? t("linkCopied") : t("shareProperty")}
            </button>
            <button
              onClick={copyPhone}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-surface-2 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Copy size={13} />
              {copied === "phone" ? t("phoneCopied") : t("copyNumber")}
            </button>
          </div>
        </div>
      </div>

      {/* فورم التقاط العميل قبل واتساب */}
      {leadOpen && (
        <LeadModal property={p} waUrl={wa} onClose={() => setLeadOpen(false)} />
      )}
    </div>
  );
}
