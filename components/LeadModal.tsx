"use client";

import { useEffect, useState } from "react";
import { X, MessageCircle, Loader2 } from "lucide-react";
import type { Property } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

interface Props {
  property: Property;
  /** الرابط اللي كان هيفتح — يُفتح تلقائياً بعد نجاح التسجيل */
  waUrl: string;
  onClose: () => void;
}

/**
 * فورم صغير قبل فتح واتساب: اسم العميل + رقمه ← يتسجل كـ lead في Supabase
 * وبعدين يفتح واتساب تلقائياً. لو التسجيل فشل برضو نفتح واتساب (الأولوية للعميل)
 * ونعمل وسم للخطأ في الكونسول.
 */
export default function LeadModal({ property, waUrl, onClose }: Props) {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // قفل سكرول + Escape
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const digits = phone.replace(/[^\d]/g, "");
    if (name.trim().length < 2)
      return setError(lang === "ar" ? "اكتب اسمك من فضلك (حرفين على الأقل)" : "Please enter your name (at least 2 characters)");
    if (digits.length < 8)
      return setError(lang === "ar" ? "اكتب رقم موبايل صحيح" : "Please enter a valid phone number");

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          customer_name: name.trim(),
          phone_number: digits,
        }),
      });
      if (!res.ok && res.status !== 503) {
        // 503 = جدول الليدز لسه مش متعمل — منفتحش واتساب ونعرض الخطأ
        setError(
          lang === "ar"
            ? "حصلت مشكلة في التسجيل — كلمنا مباشرة على 01556956343"
            : "Something went wrong — call us directly at 01556956343"
        );
        setBusy(false);
        return;
      }
    } catch {
      // الشبكة وقعت — منمنعش العميل يكمل
      setBusy(false);
      return setError(lang === "ar" ? "اتأكد من اتصالك بالإنترنت وجرب تاني" : "Check your internet connection and try again");
    }

    // نجاح — نفتح واتساب
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={lang === "ar" ? "بيانات التواصل" : "Contact details"}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl slide-up-sheet sm:animate-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <MessageCircle size={20} className="text-emerald-500" />
            {t("leadModalTitle")}
          </h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-ink rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-slate-700 line-clamp-1">{property.title}</p>
            <p className="text-accent font-extrabold text-sm mt-0.5">
              {formatPrice(property.price)} {t("egp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("leadYourName")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "ar" ? "مثال: أحمد محمد" : "e.g. Ahmed Mohamed"}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-surface-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
              autoComplete="name"
              name="name"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("leadYourPhone")}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-surface-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm text-start"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">{t("leadPrivacy")}</p>
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="text-rose-600 text-sm font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
            {busy ? (lang === "ar" ? "لحظة…" : "One moment…") : t("leadContinueWhatsapp")}
          </button>
        </form>
      </div>
    </div>
  );
}
