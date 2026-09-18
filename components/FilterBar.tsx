"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, X, RotateCcw, ArrowUpDown } from "lucide-react";
import type { Filters, SortOption } from "@/lib/types";
import { countActiveFilters } from "@/lib/types";
import { useLang, type TranslationKey } from "@/lib/i18n";
import {
  GOVERNORATES,
  getCities,
  getDistricts,
  PROPERTY_TYPES,
} from "@/lib/egypt";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}

export default function FilterBar({ filters, onChange, resultCount }: Props) {
  const { t, lang } = useLang();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  // قفل أي قائمة مفتوحة لما تدوس بره
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const activeCount = countActiveFilters(filters);
  const cities = getCities(filters.governorate);
  const districts = getDistricts(filters.governorate, filters.city);

  const clearAll = () =>
    onChange({
      ...filters,
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
    });

  /* ---------- عناصر الفلتر القابلة لإعادة الاستخدام ---------- */

  const Dropdown = ({
    k,
    label,
    active,
    children,
    block = false,
  }: {
    k: string;
    label: React.ReactNode;
    active?: boolean;
    children: React.ReactNode;
    block?: boolean;
  }) => {
    const isOpen = openKey === k;
    return (
      <div className={block ? "w-full" : "relative shrink-0"}>
        <button
          type="button"
          onClick={() => setOpenKey(isOpen ? null : k)}
          className={`w-full flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-colors ${
            active
              ? "bg-[#1e3a8a]/10 text-[#1e3a8a] border-[#1e3a8a]/40"
              : "bg-white text-slate-700 border-slate-300 hover:border-[#1e3a8a]/40"
          }`}
        >
          {label}
          <ChevronDown
            size={15}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div
            className={
              block
                ? "mt-2 rounded-xl border border-slate-200 bg-white shadow-sm p-1.5 max-h-72 overflow-y-auto thin-scrollbar"
                : "absolute top-full mt-2 start-0 z-50 min-w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 max-h-80 overflow-y-auto thin-scrollbar"
            }
          >
            {children}
          </div>
        )}
      </div>
    );
  };

  const Option = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${
        selected
          ? "bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold"
          : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </button>
  );

  const NumberRange = ({
    min,
    max,
    minPh,
    maxPh,
    onMin,
    onMax,
  }: {
    min: number | null;
    max: number | null;
    minPh: string;
    maxPh: string;
    onMin: (v: number | null) => void;
    onMax: (v: number | null) => void;
  }) => (
    <div className="p-2 flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={min ?? ""}
        onChange={(e) => onMin(e.target.value ? +e.target.value : null)}
        placeholder={minPh}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a]"
      />
      <span className="text-slate-400 text-sm shrink-0">—</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={max ?? ""}
        onChange={(e) => onMax(e.target.value ? +e.target.value : null)}
        placeholder={maxPh}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a]"
      />
    </div>
  );

  const tabs = (
    <div className="flex bg-slate-100 rounded-xl p-1 shrink-0" role="tablist">
      {(
        [
          { v: "", label: t("all") },
          { v: "sale", label: t("sale") },
          { v: "rent", label: t("rent") },
        ] as const
      ).map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => set({ listing_type: o.v })}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            filters.listing_type === o.v
              ? "bg-white text-[#1e3a8a] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const governorateFilter = (block = false) => (
    <Dropdown
      k="gov"
      block={block}
      active={!!filters.governorate}
      label={filters.governorate || t("anyGovernorate")}
    >
      <Option
        selected={!filters.governorate}
        onClick={() => {
          set({ governorate: "", city: "", district: "" });
          setOpenKey(block ? "gov" : null);
        }}
      >
        {t("anyGovernorate")}
      </Option>
      {GOVERNORATES.map((g) => (
        <Option
          key={g}
          selected={filters.governorate === g}
          onClick={() => {
            set({ governorate: g, city: "", district: "" });
            setOpenKey(block ? "city" : null);
          }}
        >
          {g}
        </Option>
      ))}
    </Dropdown>
  );

  const cityFilter = (block = false) => (
    <Dropdown
      k="city"
      block={block}
      active={!!filters.city}
      label={filters.city || t("anyCity")}
    >
      <Option
        selected={!filters.city}
        onClick={() => {
          set({ city: "", district: "" });
          setOpenKey(block ? "city" : null);
        }}
      >
        {t("anyCity")}
      </Option>
      {cities.map((c) => (
        <Option
          key={c}
          selected={filters.city === c}
          onClick={() => {
            set({ city: c, district: "" });
            setOpenKey(block ? "district" : null);
          }}
        >
          {c}
        </Option>
      ))}
    </Dropdown>
  );

  const districtFilter = (block = false) => (
    <Dropdown
      k="district"
      block={block}
      active={!!filters.district}
      label={filters.district || t("anyDistrict")}
    >
      <Option
        selected={!filters.district}
        onClick={() => {
          set({ district: "" });
          setOpenKey(block ? "district" : null);
        }}
      >
        {t("anyDistrict")}
      </Option>
      {districts.map((d) => (
        <Option
          key={d}
          selected={filters.district === d}
          onClick={() => {
            set({ district: d });
            setOpenKey(null);
          }}
        >
          {d}
        </Option>
      ))}
    </Dropdown>
  );

  const typeFilter = (block = false) => (
    <Dropdown
      k="type"
      block={block}
      active={!!filters.property_type}
      label={filters.property_type || t("anyType")}
    >
      <Option
        selected={!filters.property_type}
        onClick={() => {
          set({ property_type: "" });
          setOpenKey(null);
        }}
      >
        {t("anyType")}
      </Option>
      {PROPERTY_TYPES.map((pt) => (
        <Option
          key={pt}
          selected={filters.property_type === pt}
          onClick={() => {
            set({ property_type: pt });
            setOpenKey(null);
          }}
        >
          {pt}
        </Option>
      ))}
    </Dropdown>
  );

  const priceFilter = (block = false) => (
    <Dropdown
      k="price"
      block={block}
      active={filters.minPrice !== null || filters.maxPrice !== null}
      label={
        filters.minPrice !== null || filters.maxPrice !== null
          ? `${filters.minPrice !== null ? filters.minPrice.toLocaleString("en-US") : "…"} — ${filters.maxPrice !== null ? filters.maxPrice.toLocaleString("en-US") : "…"}`
          : t("price")
      }
    >
      <NumberRange
        min={filters.minPrice}
        max={filters.maxPrice}
        minPh={t("minPrice")}
        maxPh={t("maxPrice")}
        onMin={(v) => set({ minPrice: v })}
        onMax={(v) => set({ maxPrice: v })}
      />
    </Dropdown>
  );

  const areaFilter = (block = false) => (
    <Dropdown
      k="area"
      block={block}
      active={filters.minArea !== null || filters.maxArea !== null}
      label={
        filters.minArea !== null || filters.maxArea !== null
          ? `${filters.minArea !== null ? filters.minArea : "…"} — ${filters.maxArea !== null ? filters.maxArea : "…"} ${lang === "ar" ? "م²" : "m²"}`
          : t("area")
      }
    >
      <NumberRange
        min={filters.minArea}
        max={filters.maxArea}
        minPh={t("minArea")}
        maxPh={t("maxArea")}
        onMin={(v) => set({ minArea: v })}
        onMax={(v) => set({ maxArea: v })}
      />
    </Dropdown>
  );

  const roomsFilter = (block = false) => (
    <Dropdown
      k="beds"
      block={block}
      active={filters.bedrooms !== null}
      label={
        filters.bedrooms !== null
          ? `${filters.bedrooms}+ ${t("roomsOrMore")}`
          : t("bedrooms")
      }
    >
      {[null, 1, 2, 3, 4, 5].map((n) => (
        <Option
          key={String(n)}
          selected={filters.bedrooms === n}
          onClick={() => {
            set({ bedrooms: n });
            setOpenKey(null);
          }}
        >
          {n === null ? t("all") : `${n}+ ${t("roomsOrMore")}`}
        </Option>
      ))}
    </Dropdown>
  );

  const bathsFilter = (block = false) => (
    <Dropdown
      k="baths"
      block={block}
      active={filters.bathrooms !== null}
      label={
        filters.bathrooms !== null
          ? `${filters.bathrooms}+ ${t("bathOrMore")}`
          : t("bathrooms")
      }
    >
      {[null, 1, 2, 3, 4].map((n) => (
        <Option
          key={String(n)}
          selected={filters.bathrooms === n}
          onClick={() => {
            set({ bathrooms: n });
            setOpenKey(null);
          }}
        >
          {n === null ? t("all") : `${n}+ ${t("bathOrMore")}`}
        </Option>
      ))}
    </Dropdown>
  );

  const sortFilter = (block = false) => (
    <Dropdown
      k="sort"
      block={block}
      active={filters.sort !== "newest"}
      label={
        <>
          <ArrowUpDown size={15} />
          {t(filters.sort as TranslationKey)}
        </>
      }
    >
      {(
        [
          ["newest", t("newest")],
          ["price_desc", t("priceDesc")],
          ["price_asc", t("priceAsc")],
          ["area_desc", t("areaDesc")],
        ] as [SortOption, string][]
      ).map(([v, label]) => (
        <Option
          key={v}
          selected={filters.sort === v}
          onClick={() => {
            set({ sort: v });
            setOpenKey(null);
          }}
        >
          {label}
        </Option>
      ))}
    </Dropdown>
  );

  const clearBtn = activeCount > 0 && (
    <button
      type="button"
      onClick={clearAll}
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 whitespace-nowrap shrink-0"
    >
      <RotateCcw size={15} />
      {t("clearAll")}
    </button>
  );

  return (
    <div ref={barRef}>
      {/* ===== الديسكتوب: شريط أفقي ===== */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        {/* flex-wrap بدل overflow-x-auto — لأن القص البيقص أي قايمة منسدلة تنزل تحت الشريط */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs}
          {governorateFilter()}
          {cityFilter()}
          {districtFilter()}
          {typeFilter()}
          {priceFilter()}
          {areaFilter()}
          {roomsFilter()}
          {bathsFilter()}
          <div className="ms-auto flex items-center gap-2">
            {clearBtn}
            {sortFilter()}
          </div>
        </div>
      </div>

      {/* ===== الموبايل: تبويبات + زرار بوتوم شيت ===== */}
      <div className="md:hidden flex items-center gap-2">
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">{tabs}</div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold shrink-0"
        >
          <SlidersHorizontal size={16} />
          {t("filters")}
          {activeCount > 0 && (
            <span className="min-w-5 h-5 px-1 rounded-full bg-amber-400 text-[#172554] text-[11px] font-extrabold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ===== البوتوم شيت (موبايل) ===== */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col slide-up-sheet">
            {/* رأس الشيت */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#1e3a8a]" />
                {t("filters")}
              </h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* الفلاتر */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
              {governorateFilter(true)}
              {cityFilter(true)}
              {districtFilter(true)}
              {typeFilter(true)}
              {priceFilter(true)}
              {areaFilter(true)}
              {roomsFilter(true)}
              {bathsFilter(true)}
              <div className="flex justify-center pt-1">{clearBtn}</div>
            </div>

            {/* زرار العرض */}
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full py-3.5 rounded-xl bg-[#1e3a8a] text-white font-bold text-base active:scale-[0.98] transition-transform"
              >
                {t("showResults")} ({resultCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
