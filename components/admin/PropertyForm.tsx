"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, UploadCloud, Star, ArrowLeft, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Property, ListingType, RentPeriod } from "@/lib/types";
import { GOVERNORATES, getCities, getDistricts, PROPERTY_TYPES, FEATURES } from "@/lib/egypt";

interface Props {
  initial: Property | null;
  onDone: () => void;
  onCancel: () => void;
}

export default function PropertyForm({ initial, onDone, onCancel }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    listing_type: (initial?.listing_type ?? "sale") as ListingType,
    rent_period: (initial?.rent_period ?? "monthly") as RentPeriod,
    property_type: initial?.property_type ?? PROPERTY_TYPES[0],
    price: initial?.price?.toString() ?? "",
    governorate: initial?.governorate ?? "القاهرة",
    city: initial?.city ?? "",
    district: initial?.district ?? "",
    area: initial?.area?.toString() ?? "",
    bedrooms: initial?.bedrooms?.toString() ?? "2",
    bathrooms: initial?.bathrooms?.toString() ?? "1",
    features: initial?.features ?? ([] as string[]),
    images: initial?.images ?? ([] as string[]),
    contact_phone: initial?.contact_phone ?? "01151707244",
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  /* ---------- رفع الصور ---------- */
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setForm((f) => ({ ...f, images: [...f.images, data.url] }));
        } else {
          alert(data.error ?? "Upload failed");
        }
      } catch {
        alert("Upload failed");
      }
    }
    setUploading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  /* ---------- الحفظ ---------- */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.price || !form.area) {
      alert(t("requiredField"));
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      price: +form.price,
      area: +form.area,
      bedrooms: +form.bedrooms,
      bathrooms: +form.bathrooms,
      rent_period: form.listing_type === "rent" ? form.rent_period : null,
    };
    const res = await fetch("/api/admin/properties", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initial ? { ...payload, id: initial.id } : payload),
    });
    setBusy(false);
    if (res.ok) {
      alert(initial ? t("updated") : t("added"));
      onDone();
    } else {
      alert("Error: " + (await res.text()));
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] text-sm";
  const labelCls = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 font-bold text-sm"
      >
        <ArrowLeft size={18} />
        {t("cancel")}
      </button>

      <h1 className="text-2xl font-extrabold text-slate-800 mb-6">
        {initial ? t("editProperty") : t("addProperty")}
      </h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-5">
        {/* العنوان */}
        <div>
          <label className={labelCls}>
            {t("title")} <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={t("titlePh")}
            className={inputCls}
            required
          />
        </div>

        {/* نوع العرض + الإيجار */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("listingType")}</label>
            <div className="flex bg-slate-100 rounded-xl p-1">
              {(["sale", "rent"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set({ listing_type: v })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    form.listing_type === v
                      ? "bg-white text-[#1e3a8a] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {v === "sale" ? t("sale") : t("rent")}
                </button>
              ))}
            </div>
          </div>
          {form.listing_type === "rent" && (
            <div>
              <label className={labelCls}>{t("rentPeriod")}</label>
              <select
                value={form.rent_period}
                onChange={(e) => set({ rent_period: e.target.value as RentPeriod })}
                className={inputCls}
              >
                <option value="monthly">{t("monthly")}</option>
                <option value="yearly">{t("yearly")}</option>
                <option value="daily">{t("daily")}</option>
              </select>
            </div>
          )}
        </div>

        {/* النوع والسعر */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("propertyType")}</label>
            <select
              value={form.property_type}
              onChange={(e) => set({ property_type: e.target.value })}
              className={inputCls}
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              {t("priceValue")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.price}
              onChange={(e) => set({ price: e.target.value })}
              className={inputCls}
              required
            />
          </div>
        </div>

        {/* المكان */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>{t("governorateLabel")}</label>
            <select
              value={form.governorate}
              onChange={(e) => set({ governorate: e.target.value, city: "", district: "" })}
              className={inputCls}
            >
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("cityLabel")}</label>
            <select
              value={form.city}
              onChange={(e) => set({ city: e.target.value, district: "" })}
              className={inputCls}
            >
              <option value="">—</option>
              {getCities(form.governorate).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("districtLabel")}</label>
            <select
              value={form.district}
              onChange={(e) => set({ district: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {getDistricts(form.governorate, form.city).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* المساحة والغرف */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>
              {t("areaValue")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.area}
              onChange={(e) => set({ area: e.target.value })}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>{t("bedroomsValue")}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.bedrooms}
              onChange={(e) => set({ bedrooms: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("bathroomsValue")}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.bathrooms}
              onChange={(e) => set({ bathrooms: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        {/* الوصف */}
        <div>
          <label className={labelCls}>{t("description")}</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder={t("descriptionPh")}
            rows={4}
            className={inputCls + " resize-y"}
          />
        </div>

        {/* المميزات */}
        <div>
          <label className={labelCls}>{t("selectFeature")}</label>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const on = form.features.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    set({
                      features: on
                        ? form.features.filter((x) => x !== f)
                        : [...form.features, f],
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    on
                      ? "bg-[#1e3a8a] text-white border-[#1e3a8a]"
                      : "bg-white text-slate-600 border-slate-300 hover:border-[#1e3a8a]"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* الصور */}
        <div>
          <label className={labelCls}>
            {t("images")} {form.images.length > 0 && `(${form.images.length})`}
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-[#1e3a8a] bg-[#1e3a8a]/5"
                : "border-slate-300 hover:border-[#1e3a8a]/50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="mx-auto text-[#1e3a8a] animate-spin" size={32} />
            ) : (
              <UploadCloud className="mx-auto text-slate-400" size={32} />
            )}
            <p className="text-sm text-slate-500 mt-2 font-semibold">
              {t("dropImages")}
            </p>
          </div>

          {/* المعاينات */}
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {form.images.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-[#172554] text-[10px] font-extrabold">
                      {t("mainImage")}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          set({
                            images: [
                              url,
                              ...form.images.filter((x) => x !== url),
                            ],
                          })
                        }
                        className="p-1 rounded bg-white/90"
                        title={t("mainImage")}
                      >
                        <Star size={12} className="text-amber-500" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        set({ images: form.images.filter((x) => x !== url) })
                      }
                      className="p-1 rounded bg-white/90"
                      title={t("removeImage")}
                    >
                      <X size={12} className="text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* رقم التواصل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("contactPhone")}</label>
            <input
              value={form.contact_phone}
              onChange={(e) => set({ contact_phone: e.target.value })}
              placeholder={t("contactPhonePh")}
              dir="ltr"
              className={inputCls}
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set({ is_featured: e.target.checked })}
                className="w-4 h-4 accent-[#1e3a8a]"
              />
              ⭐ {t("featured")}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set({ is_published: e.target.checked })}
                className="w-4 h-4 accent-[#1e3a8a]"
              />
              {t("publish")}
            </label>
          </div>
        </div>
      </div>

      {/* أزرار الحفظ */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={busy || uploading}
          className="flex-1 py-3.5 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-[#172554] transition-colors disabled:opacity-60 active:scale-[0.99]"
        >
          {busy ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
