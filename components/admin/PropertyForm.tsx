"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, UploadCloud, Star, ArrowLeft, Loader2, Video } from "lucide-react";
import { useLang } from "@/lib/i18n";
import Select from "@/components/ui/Select";
import { adminFetch } from "@/lib/adminFetch";
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
    video: initial?.video ?? "",
    negotiable: initial?.negotiable ?? false,
    contact_phone: initial?.contact_phone ?? "01556956343",
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  /* ---------- رفع الصور ---------- */
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (list.length === 0) return;
    setUploading(true);
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await adminFetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          if (file.type.startsWith("video/")) {
            setForm((f) => ({ ...f, video: data.url }));
          } else {
            setForm((f) => ({ ...f, images: [...f.images, data.url] }));
          }
        } else if (res.status === 413) {
          alert(file.type.startsWith("video/") ? t("videoTooBig") : (data.error ?? "Upload failed"));
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
    let res: Response;
    try {
      res = await adminFetch("/api/admin/properties", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial ? { ...payload, id: initial.id } : payload),
      });
    } catch {
      setBusy(false);
      alert("تعذّر الاتصال بالسيرفر — اتأكد إن الاتصال شغال وجرّب تاني");
      return;
    }
    setBusy(false);
    if (res.status === 401) {
      alert(t("sessionExpired"));
      return;
    }
    if (res.ok) {
      alert(initial ? t("updated") : t("added"));
      onDone();
    } else {
      alert("حدث خطأ أثناء الحفظ — حاول تاني");
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-300 bg-surface-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm";
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

      <div className="bg-surface rounded-2xl border border-slate-200 p-5 md:p-6 space-y-5">
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
                      ? "bg-surface text-accent shadow-sm"
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
              <Select
                value={form.rent_period}
                onChange={(e) => set({ rent_period: e.target.value as RentPeriod })}
              >
                <option value="monthly">{t("monthly")}</option>
                <option value="yearly">{t("yearly")}</option>
                <option value="daily">{t("daily")}</option>
              </Select>
            </div>
          )}
        </div>

        {/* النوع والسعر */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("propertyType")}</label>
            <Select
              value={form.property_type}
              onChange={(e) => set({ property_type: e.target.value })}
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </Select>
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
            <Select
              value={form.governorate}
              onChange={(e) => set({ governorate: e.target.value, city: "", district: "" })}
            >
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelCls}>{t("cityLabel")}</label>
            <Select
              value={form.city}
              onChange={(e) => set({ city: e.target.value, district: "" })}
            >
              <option value="">—</option>
              {getCities(form.governorate).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelCls}>{t("districtLabel")}</label>
            <Select
              value={form.district}
              onChange={(e) => set({ district: e.target.value })}
            >
              <option value="">—</option>
              {getDistricts(form.governorate, form.city).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
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
                      ? "bg-accent-deep text-white border-accent-deep"
                      : "bg-surface text-slate-600 border-slate-300 hover:border-accent"
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
                ? "border-accent bg-accent/10"
                : "border-slate-300 hover:border-accent/50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              hidden
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="mx-auto text-accent animate-spin" size={32} />
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
                    <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-ink text-[10px] font-extrabold">
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
                        className="p-1 rounded bg-surface-2/90"
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

        {/* الفيديو */}
        <div>
          <label className={labelCls}>{t("video")}</label>
          <div className="flex gap-2">
            <input
              value={form.video}
              onChange={(e) => set({ video: e.target.value })}
              placeholder={t("videoPh")}
              dir="ltr"
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:border-accent whitespace-nowrap shrink-0"
            >
              <UploadCloud size={15} />
              {t("uploadVideo")}
            </button>
          </div>
          {form.video && (
            <video
              src={form.video}
              controls
              className="mt-3 w-full max-w-sm rounded-xl border border-slate-200"
            />
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
          <div className="flex items-end gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.negotiable}
                onChange={(e) => set({ negotiable: e.target.checked })}
                className="w-4 h-4 accent-[#7aa5f8]"
              />
              💬 {t("negotiable")}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set({ is_featured: e.target.checked })}
                className="w-4 h-4 accent-[#7aa5f8]"
              />
              ⭐ {t("featured")}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set({ is_published: e.target.checked })}
                className="w-4 h-4 accent-[#7aa5f8]"
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
          className="flex-1 py-3.5 rounded-xl bg-accent-deep text-white font-bold hover:bg-accent-hover transition-colors disabled:opacity-60 active:scale-[0.99]"
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
