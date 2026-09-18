"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Phone,
  LogOut,
  Check,
  Clock,
  Trash2,
  Building2,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { adminFetch } from "@/lib/adminFetch";
import Select from "@/components/ui/Select";

interface Lead {
  id: string;
  property_id: string | null;
  customer_name: string;
  phone_number: string;
  status: "contacted" | "not_contacted";
  note?: string;
  created_at: string;
}

/** تنسيق التاريخ بالعربي */
function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function LeadsPage() {
  const { t } = useLang();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<"all" | "contacted" | "not_contacted">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await adminFetch("/api/admin/leads");
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("حصلت مشكلة في تحميل العملاء — اتأكد من الاتصال وقولي تاني");
      setLoading(false);
      return;
    }
    setAuthed(true);
    setLeads(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(lead: Lead) {
    const next = lead.status === "contacted" ? "not_contacted" : "contacted";
    // تحديث متفائل — الحالة تتغير فوراً في الواجهة ثم تُحفظ
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
    const res = await adminFetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: next }),
    });
    if (!res.ok) {
      // رجّع الحالة القديمة لو فشل الحفظ
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)));
      setError("التحديث ما اتحفظش — جرب تاني");
    }
  }

  /** حفظ ملاحظة العميل */
  async function saveNote(lead: Lead, note: string) {
    const prev = lead.note ?? "";
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, note } : l)));
    const res = await adminFetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, note }),
    });
    if (!res.ok) {
      let hint = "الملاحظة ما اتحفظتش — جرب تاني";
      try {
        const j = await res.json();
        if (j?.error === "note_column_missing") hint = "نفّذ supabase/leads-note.sql في SQL Editor الأول";
      } catch {}
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, note: prev } : l)));
      setError(hint);
    }
  }

  async function remove(id: string) {
    if (!confirm("متأكد من حذف العميل ده؟")) return;
    setLeads((ls) => ls.filter((l) => l.id !== id));
    await adminFetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
  }

  const filtered = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const counts = useMemo(
    () => ({
      all: leads.length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      not_contacted: leads.filter((l) => l.status === "not_contacted").length,
    }),
    [leads]
  );

  /* ---------- شاشة الدخول (نفس نمط /admin) ---------- */
  if (authed === false) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1e3a8a]/10 flex items-center justify-center mb-4">
            <Lock />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{t("login")}</h1>
          <p className="text-sm text-slate-500 mb-6">{t("adminOnly")}</p>
          <Link
            href="/admin"
            className="inline-block px-6 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-[#172554] transition-colors"
          >
            {t("loginBtn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Users className="text-[#1e3a8a]" />
          العملاء المهتمين
          <span className="text-sm font-bold text-slate-400">({counts.all})</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            تحديث
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50"
          >
            <Building2 size={15} />
            العقارات
          </Link>
          <button
            onClick={async () => {
              const { getSupabase } = await import("@/lib/supabase");
              await getSupabase()?.auth.signOut();
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin";
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50"
          >
            <LogOut size={15} />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", `الكل (${counts.all})`],
            ["not_contacted", `لم يتم التواصل (${counts.not_contacted})`],
            ["contacted", `تم التواصل (${counts.contacted})`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === v
                ? "bg-[#1e3a8a] text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:border-[#1e3a8a]/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-bold mb-4">
          {error}
        </div>
      )}

      {/* التحميل */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">📞</p>
          <p className="font-bold text-slate-600">مفيش عملاء لسه</p>
          <p className="text-sm text-slate-400 mt-1">
            أول ما حد يدوس "تواصل واتساب" في صفحة عقار هيظهر هنا
          </p>
        </div>
      ) : (
        <>
          {/* جدول — ديسكتوب */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3 font-bold">العميل</th>
                  <th className="text-start px-4 py-3 font-bold">رقم الموبايل</th>
                  <th className="text-start px-4 py-3 font-bold">العقار</th>
                  <th className="text-start px-4 py-3 font-bold">التاريخ</th>
                  <th className="text-start px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-700">{l.customer_name}</td>
                    <td className="px-4 py-3" dir="ltr">
                      <a
                        href={`tel:+${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                        className="flex items-center gap-1.5 text-[#1e3a8a] font-bold hover:underline"
                      >
                        <Phone size={14} />
                        {l.phone_number}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-52 truncate">
                      {l.property_id ? (
                        <a
                          href={`/properties/${l.property_id}`}
                          className="hover:underline"
                          target="_blank"
                        >
                          عرض العقار
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleStatus(l)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            l.status === "contacted"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {l.status === "contacted" ? <Check size={13} /> : <Clock size={13} />}
                          {l.status === "contacted" ? "تم التواصل" : "لم يتم التواصل"}
                        </button>
                        <NoteButton lead={l} onSave={(n) => saveNote(l, n)} />
                      </div>
                      {l.note && (
                        <p className="text-xs text-slate-500 mt-1.5 max-w-72 whitespace-pre-line">📝 {l.note}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <a
                          href={`https://wa.me/${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                          title="واتساب"
                        >
                          💬
                        </a>
                        <button
                          onClick={() => remove(l.id)}
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* كروت — موبايل */}
          <div className="md:hidden space-y-3">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-800">{l.customer_name}</p>
                    <a
                      href={`tel:+${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                      className="text-[#1e3a8a] font-bold text-sm mt-0.5 block"
                      dir="ltr"
                    >
                      {l.phone_number}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleStatus(l)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                        l.status === "contacted"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {l.status === "contacted" ? <Check size={13} /> : <Clock size={13} />}
                      {l.status === "contacted" ? "تم التواصل" : "لم يتم"}
                    </button>
                    <NoteButton lead={l} onSave={(n) => saveNote(l, n)} />
                  </div>
                </div>
                {l.note && (
                  <p className="text-xs text-slate-500 mt-2 whitespace-pre-line">📝 {l.note}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">{fmtDate(l.created_at)}</p>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://wa.me/${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
                  >
                    💬 واتساب
                  </a>
                  {l.property_id && (
                    <a
                      href={`/properties/${l.property_id}`}
                      target="_blank"
                      className="flex-1 text-center py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold"
                    >
                      العقار
                    </a>
                  )}
                  <button
                    onClick={() => remove(l.id)}
                    className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** زرار الملاحظة — بيفتح بوكس صغير للكتابة والحفظ */
function NoteButton({ lead, onSave }: { lead: Lead; onSave: (note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(lead.note ?? "");
  const hasNote = !!lead.note;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setVal(lead.note ?? "");
          setOpen(!open);
        }}
        title="ملاحظة"
        className={`p-2 rounded-lg ${
          hasNote ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:bg-slate-100"
        }`}
      >
        <StickyNote size={14} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 end-0 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-3">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="تفاصيل المكالمة... مثال: اتفقنا على 4 مليون — بيرد السبت"
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a]"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onSave(val.trim());
                setOpen(false);
              }}
              className="flex-1 py-2 rounded-lg bg-[#1e3a8a] text-white text-xs font-bold hover:bg-[#172554]"
            >
              حفظ
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Lock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
