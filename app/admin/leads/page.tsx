"use client";

import { useEffect, useMemo, useState, Fragment, useRef } from "react";
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
  Search,
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
  follow_up?: string | null;
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
  // العميل اللي خانة تفاصيله مفتوحة — واحدة بس في نفس الوقت
  const [expanded, setExpanded] = useState<string | null>(null);
  // تنبيه العميل الجديد: أعرف آخر عميل شفته + صوت + إشعار
  const [newLeadToast, setNewLeadToast] = useState<string | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);

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
      setError(t("loadFailed"));
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

  /* ---------- تنبيه العميل الجديد: بولينج كل 30 ثانية ---------- */
  useEffect(() => {
    const check = async () => {
      try {
        const res = await adminFetch("/api/admin/leads");
        if (!res.ok) return;
        const rows: Lead[] = await res.json();
        const newest = rows[0];
        if (!newest) return;
        if (lastSeenIdRef.current === null) {
          // أول تحميل — سجل بس من غير تنبيه
          lastSeenIdRef.current = newest.id;
          return;
        }
        if (newest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = newest.id;
          setLeads(rows);
          setNewLeadToast(newest.customer_name);
          // صوت تنبيه خفيف (نغمة قصيرة متولدة — مفيش ملفات صوت)
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.04;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
            setTimeout(() => ctx.close(), 400);
          } catch {}
          // إشعار المتصفح — بس لو مسموح
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(t("newLeadToast"), { body: `${newest.customer_name} — ${newest.phone_number}` });
            }
          } catch {}
          setTimeout(() => setNewLeadToast(null), 8000);
        } else {
          setLeads(rows);
        }
      } catch {}
    };
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
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
      setError(t("updateFailed"));
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
      let hint = t("noteFailed");
      try {
        const j = await res.json();
        if (j?.error === "note_column_missing") hint = t("runNoteSql");
      } catch {}
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, note: prev } : l)));
      setError(hint);
    }
  }

  /** حفظ موعد المتابعة */
  async function saveFollowUp(lead: Lead, follow_up: string | null) {
    const prev = lead.follow_up ?? null;
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, follow_up } : l)));
    const res = await adminFetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, follow_up }),
    });
    if (!res.ok) {
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, follow_up: prev } : l)));
      setError(t("followUpFailed"));
    }
  }

  /** حالة المتابعة: متأخر / النهاردة / قريب */
  function followUpState(d: string | null | undefined): "overdue" | "today" | "soon" | null {
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d + "T00:00:00");
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return "overdue";
    if (diff === 0) return "today";
    if (diff <= 2) return "soon";
    return null;
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDeleteLead"))) return;
    setLeads((ls) => ls.filter((l) => l.id !== id));
    const res = await adminFetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      // الحذف فشل — نرجّع الوضع الحقيقي من القاعدة ونعرض رسالة واضحة
      setError(t("deleteFailed"));
      load();
    }
  }

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads
      .filter((l) => filter === "all" || l.status === filter)
      .filter(
        (l) =>
          !needle ||
          l.customer_name.toLowerCase().includes(needle) ||
          l.phone_number.includes(needle)
      );
  }, [leads, filter, q]);

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
        <div className="bg-surface rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Lock />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{t("login")}</h1>
          <p className="text-sm text-slate-500 mb-6">{t("adminOnly")}</p>
          <Link
            href="/admin"
            className="inline-block px-6 py-3 rounded-xl bg-accent-deep text-white font-bold hover:bg-accent-hover transition-colors"
          >
            {t("loginBtn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* تنبيه عميل جديد — يظهر فوق وبيختفي لوحده */}
      {newLeadToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-[90] flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow-2xl animate-bounce"
        >
          🔔 {t("newLeadToast")} — {newLeadToast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Users className="text-accent" />
          {t("leads")}
          <span className="text-sm font-bold text-slate-400">({counts.all})</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-surface-2"
          >
            <RefreshCw size={15} />
            {t("refresh")}
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-surface-2"
          >
            <Building2 size={15} />
            {t("propertiesPage")}
          </Link>
          <button
            onClick={async () => {
              const { getSupabase } = await import("@/lib/supabase");
              await getSupabase()?.auth.signOut();
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin";
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-surface-2"
          >
            <LogOut size={15} />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* شريط بحث العملاء — اسم أو رقم */}
      <div className="relative mb-3 max-w-md">
        <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchLeadPh")}
          aria-label={t("searchLeadPh")}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 bg-surface text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", `${t("filterAll")} (${counts.all})`],
            ["not_contacted", `${t("filterNotContacted")} (${counts.not_contacted})`],
            ["contacted", `${t("filterContacted")} (${counts.contacted})`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === v
                ? "bg-accent-deep text-white"
                : "bg-surface border border-slate-300 text-slate-600 hover:border-accent/40"
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
            <div key={i} className="bg-surface rounded-2xl border border-slate-200 h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-slate-200">
          <p className="text-4xl mb-3">{q ? "🔍" : "📞"}</p>
          <p className="font-bold text-slate-600">{q ? t("searchNoResults") : t("noLeadsYet")}</p>
          <p className="text-sm text-slate-400 mt-1">{q ? t("searchLeadPh") : t("noLeadsHint")}</p>
        </div>
      ) : (
        <>
          {/* جدول — ديسكتوب */}
          <div className="hidden md:block bg-surface rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3 font-bold">{t("colClient")}</th>
                  <th className="text-start px-4 py-3 font-bold">{t("colPhone")}</th>
                  <th className="text-start px-4 py-3 font-bold">{t("colProperty")}</th>
                  <th className="text-start px-4 py-3 font-bold">{t("colDate")}</th>
                  <th className="text-start px-4 py-3 font-bold">{t("colStatus")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((l) => (
                  <Fragment key={l.id}>
                  <tr className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        {l.customer_name}
                        {followUpState(l.follow_up) === "overdue" && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold whitespace-nowrap">
                            ⏰ {t("followUpOverdue")}
                          </span>
                        )}
                        {followUpState(l.follow_up) === "today" && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold whitespace-nowrap">
                            📅 {t("followUpToday")}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      <a
                        href={`tel:+${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                        className="flex items-center gap-1.5 text-accent font-bold hover:underline"
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
                          {t("viewProperty")}
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
                          {l.status === "contacted" ? t("statusContacted") : t("statusNotContacted")}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <a
                          href={`https://wa.me/${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                          title={t("whatsappTitle")}
                        >
                          💬
                        </a>
                        <button
                          onClick={() => remove(l.id)}
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                          title={t("deleteTitle")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="px-4 pb-3">
                      <LeadDetailRow
                        lead={l}
                        open={expanded === l.id}
                        onToggle={() => setExpanded(expanded === l.id ? null : l.id)}
                        onSave={(n) => saveNote(l, n)}
                        onFollowUp={(d) => saveFollowUp(l, d)}
                      />
                    </td>
                  </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* كروت — موبايل */}
          <div className="md:hidden space-y-3">
            {filtered.map((l) => (
              <div key={l.id} className="bg-surface rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-800">
                      {l.customer_name}
                      {followUpState(l.follow_up) === "overdue" && (
                        <span className="ms-2 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold">
                          ⏰ {t("followUpOverdue")}
                        </span>
                      )}
                      {followUpState(l.follow_up) === "today" && (
                        <span className="ms-2 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold">
                          📅 {t("followUpToday")}
                        </span>
                      )}
                    </p>
                    <a
                      href={`tel:+${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                      className="text-accent font-bold text-sm mt-0.5 block"
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
                      {l.status === "contacted" ? t("statusContacted") : t("statusNotContactedShort")}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{fmtDate(l.created_at)}</p>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://wa.me/${l.phone_number.startsWith("0") ? "2" + l.phone_number : l.phone_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
                  >
                    💬 {t("whatsapp")}
                  </a>
                  {l.property_id && (
                    <a
                      href={`/properties/${l.property_id}`}
                      target="_blank"
                      className="flex-1 text-center py-2 rounded-lg bg-surface-2 text-slate-600 text-xs font-bold"
                    >
                      {t("colProperty")}
                    </a>
                  )}
                  <button
                    onClick={() => remove(l.id)}
                    className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <LeadDetailRow
                  lead={l}
                  open={expanded === l.id}
                  onToggle={() => setExpanded(expanded === l.id ? null : l.id)}
                  onSave={(n) => saveNote(l, n)}
                  onFollowUp={(d) => saveFollowUp(l, d)}
                  mobile
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * سطر التفاصيل الكامل تحت كل عميل — يتفتح/يتقفل بزرار
 * جواه textarea واسع + حفظ فوري، وبيورج الملاحظة المحفوظة وهي مقفول
 */
function LeadDetailRow({
  lead,
  open,
  onToggle,
  onSave,
  onFollowUp,
  mobile = false,
}: {
  lead: Lead;
  open: boolean;
  onToggle: () => void;
  onSave: (note: string) => void;
  onFollowUp: (d: string | null) => void;
  mobile?: boolean;
}) {
  const { t } = useLang();
  const [val, setVal] = useState(lead.note ?? "");
  const [saved, setSaved] = useState(false);

  // لو الملاحظة اتحدثت من بره، حدّث القيمة المحلية
  useEffect(() => {
    setVal(lead.note ?? "");
  }, [lead.note]);

  function save() {
    onSave(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (mobile) {
    return (
      <div className="mt-3">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg w-full ${
            lead.note ? "bg-amber-50 text-amber-700" : "bg-surface-2 text-slate-500"
          }`}
        >
          <StickyNote size={13} />
          {lead.note ? t("detailsSaved") : t("addClientDetails")}
          <span className="ms-auto">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="mt-2">
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={t("callDetailsPh")}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-surface-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-slate-400"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={save}
                className="flex-1 py-2.5 rounded-lg bg-accent-deep text-white text-xs font-bold hover:bg-accent-hover"
              >
                {t("saveDetails")}
              </button>
              {saved && <span className="text-emerald-700 text-xs font-bold">{t("savedCheck")}</span>}
            </div>
            <FollowUpPicker lead={lead} onSave={onFollowUp} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
          lead.note ? "bg-amber-50 text-amber-700" : "bg-surface-2 text-slate-500 hover:text-slate-600"
        }`}
      >
        <StickyNote size={13} />
        {lead.note ? (
          <span className="max-w-96 truncate text-start">📝 {lead.note}</span>
        ) : (
          t("addDetails")
        )}
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 flex gap-2 items-start">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={t("callDetailsPh")}
            rows={3}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-surface-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-slate-400"
          />
          <button
            onClick={save}
            className="px-4 py-2.5 rounded-xl bg-accent-deep text-white text-xs font-bold hover:bg-accent-hover shrink-0"
          >
            حفظ
          </button>            {saved && <span className="text-emerald-700 text-xs font-bold self-center">{t("savedCheck")}</span>}
        </div>
      )}
      {open && <FollowUpPicker lead={lead} onSave={onFollowUp} />}
    </div>
  );
}

/** حقل موعد المتابعة — تاريخ + حفظ فوري + مسح */
function FollowUpPicker({
  lead,
  onSave,
}: {
  lead: Lead;
  onSave: (d: string | null) => void;
}) {
  const { t } = useLang();
  const [val, setVal] = useState(lead.follow_up ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVal(lead.follow_up ?? "");
  }, [lead.follow_up]);

  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="text-xs font-bold text-slate-500 whitespace-nowrap">
        ⏰ {t("followUpDate")}
      </label>
      <input
        type="date"
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          onSave(e.target.value || null);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-surface-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      {val && (
        <button
          onClick={() => {
            setVal("");
            onSave(null);
          }}
          className="text-xs font-bold text-rose-600 hover:underline"
        >
          {t("clearBtn")}
        </button>
      )}
      {saved && <span className="text-emerald-700 text-xs font-bold">✓</span>}
    </div>
  );
}

function Lock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7aa5f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
