"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import type { Filters, Property } from "@/lib/types";
import { PROPERTY_TYPES } from "@/lib/egypt";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { useLang, usePropertyTypeLabel } from "@/lib/i18n";
import { useProperties, applyFilters } from "@/lib/properties";
import { fetchPropertyById } from "@/lib/propertiesServer";
import { emptyFilters } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import PropertyCard from "@/components/PropertyCard";
import PropertyModal from "@/components/PropertyModal";
import FavoritesView from "@/components/FavoritesView";

export default function HomeView() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">…</div>}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const { t } = useLang();
  const typeLabel = usePropertyTypeLabel();
  const { properties, loading, error, refetch } = useProperties();
  const params = useSearchParams();
  const showFavs = params.get("fav") === "1";

  const [filters, setFilters] = useState<Filters>(() => {
    const base = { ...emptyFilters };
    return {
      ...base,
      q: params.get("q") ?? "",
      listing_type: (params.get("listing_type") as "sale" | "rent") ?? "",
      property_type: params.get("property_type") ?? "",
      governorate: params.get("governorate") ?? "",
      city: params.get("city") ?? "",
    };
  });

  const [qInput, setQInput] = useState(filters.q);
  const [selected, setSelected] = useState<Property | null>(null);

  // فتح مودال العقار لو الزائر جاي من رابط مباشر فيه /properties/ID (واتساب/جوجل)
  useEffect(() => {
    const m = window.location.pathname.match(/^\/properties\/([^/]+)$/);
    if (m) {
      fetchPropertyById(decodeURIComponent(m[1])).then((p) => {
        if (p) setSelected(p);
        window.history.replaceState(null, "", "/");
      });
    }
  }, []);

  const results = useMemo(() => applyFilters(properties, filters), [properties, filters]);
  const featured = useMemo(() => results.filter((p) => p.is_featured).slice(0, 3), [results]);

  return (
    <div>
      {/* ===== الهيرو ===== */}
      <section className="relative bg-surface border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute -top-24 -start-24 w-96 h-96 rounded-full bg-accent-deep/20 blur-3xl" />
          <div className="absolute bottom-0 end-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-8 text-center">
          <p className="text-xl sm:text-2xl font-extrabold tracking-widest text-accent mb-2" dir="ltr">xox</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight max-w-3xl mx-auto">
            {t("heroTitle")}
          </h1>

          {/* اختصارات الأنواع — زي المواقع العقارية الكبيرة */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["", ...PROPERTY_TYPES.slice(0, 6)].map((pt) => (
              <button
                key={pt || "all"}
                onClick={() => setFilters((f) => ({ ...f, property_type: pt }))}
                className={
                  filters.property_type === pt
                    ? "px-4 py-2 rounded-full text-sm font-bold bg-accent-deep text-white transition-colors"
                    : "px-4 py-2 rounded-full text-sm font-bold bg-surface border border-slate-200 text-slate-600 hover:border-accent hover:text-accent transition-colors"
                }
              >
                {pt ? typeLabel(pt) : t("allTypeShort")}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== البحث + الفلتر + النتائج ===== */}
      <div className="max-w-7xl mx-auto px-4 -mt-2 relative z-10 pb-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, q: qInput }));
          }}
          className="flex gap-2 mb-4"
        >
          <div className="flex-1 flex items-center gap-2 bg-surface border border-slate-200 rounded-xl px-3 shadow-sm">
            <Search size={17} className="text-slate-400 shrink-0" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full py-3 text-sm focus:outline-none bg-transparent placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 rounded-xl bg-accent-deep text-white font-bold text-sm hover:bg-accent-hover transition-colors"
          >
            {t("search")}
          </button>
        </form>

        <FilterBar filters={filters} onChange={setFilters} resultCount={results.length} />

        {showFavs ? (
          <FavoritesView onOpen={setSelected} />
        ) : (
          <>
            {featured.length > 0 && countActive(filters) === 0 && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                  <Sparkles size={15} className="text-amber-500" />
                  {t("featured")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {featured.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors max-w-64 truncate"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-slate-500 font-semibold mt-5 mb-3">
              {loading ? t("loading") : `${results.length} ${t("resultsCount")}`}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface rounded-2xl border border-slate-200 h-72 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-rose-200">
                <p className="text-4xl mb-3">📡</p>
                <h3 className="text-lg font-extrabold text-slate-700">{t("loadFailed")}</h3>
                <button
                  onClick={refetch}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-accent-deep text-white font-bold text-sm hover:bg-accent-hover transition-colors"
                >
                  {t("retry")}
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">🔍</p>
                <h3 className="text-lg font-extrabold text-slate-700">{t("noResults")}</h3>
                <p className="text-sm text-slate-400 mt-1">{t("noResultsHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((p, i) => (
                  <PropertyCard key={p.id} property={p} onOpen={setSelected} priority={i < 3} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <PropertyModal
          property={selected}
          onClose={() => setSelected(null)}
          allProperties={properties}
          onOpenProperty={(p) => {
            setSelected(null);
            setTimeout(() => setSelected(p), 50);
          }}
        />
      )}
    </div>
  );
}

function countActive(f: Filters): number {
  let n = 0;
  if (f.q) n++;
  if (f.listing_type) n++;
  if (f.property_type) n++;
  if (f.governorate) n++;
  if (f.city) n++;
  if (f.district) n++;
  if (f.minPrice !== null || f.maxPrice !== null) n++;
  if (f.minArea !== null || f.maxArea !== null) n++;
  if (f.bedrooms !== null) n++;
  if (f.bathrooms !== null) n++;
  return n;
}
