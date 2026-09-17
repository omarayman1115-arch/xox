"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Lock,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Property } from "@/lib/types";
import { formatPrice, coverImage } from "@/lib/format";
import PropertyForm from "@/components/admin/PropertyForm";

export default function AdminPage() {
  const { t, lang } = useLang();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<Property[]>([]);
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/properties");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setItems(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) {
      setPwd("");
      load();
    } else {
      setError(t("wrongPassword"));
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    await fetch(`/api/admin/properties?id=${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function togglePublished(p: Property) {
    setBusy(true);
    await fetch("/api/admin/properties", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, is_published: !p.is_published }),
    });
    await load();
    setBusy(false);
  }

  /* ---------- شاشة الدخول ---------- */
  if (authed === null || authed === false) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1e3a8a]/10 flex items-center justify-center mb-4">
            <Lock size={28} className="text-[#1e3a8a]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">
            {t("login")}
          </h1>
          <p className="text-sm text-slate-500 mb-6">{t("adminOnly")}</p>

          <form onSubmit={login} className="space-y-3">
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder={t("password")}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] text-center"
              autoFocus
            />
            {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-[#172554] transition-colors active:scale-[0.98]"
            >
              {t("loginBtn")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---------- لوحة التحكم ---------- */
  if (editing) {
    return (
      <PropertyForm
        initial={editing === "new" ? null : editing}
        onDone={async () => {
          setEditing(null);
          await load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Building2 className="text-[#1e3a8a]" />
          {t("dashboard")}
          <span className="text-sm font-bold text-slate-400">({items.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a8a] text-white font-bold text-sm hover:bg-[#172554] transition-colors active:scale-95"
          >
            <Plus size={18} />
            {t("addProperty")}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50"
          >
            <LogOut size={16} />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* الجدول — ديسكتوب */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-start px-4 py-3 font-bold">العقار</th>
              <th className="text-start px-4 py-3 font-bold">{t("price")}</th>
              <th className="text-start px-4 py-3 font-bold">{t("listingType")}</th>
              <th className="text-start px-4 py-3 font-bold">{t("location")}</th>
              <th className="text-start px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={coverImage(p)}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-bold text-slate-700 line-clamp-1 max-w-60">
                      {p.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-[#1e3a8a] whitespace-nowrap">
                  {formatPrice(p.price)} {t("egp")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {p.listing_type === "sale" ? t("sale") : t("rent")}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {p.governorate} — {p.city}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => togglePublished(p)}
                    disabled={busy}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      p.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                    {p.is_published ? "منشور" : "مسودة"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setEditing(p)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                      title={t("edit")}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={busy}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                      title={t("deleteProperty")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center text-slate-400 py-12">{t("noProperties")}</p>
        )}
      </div>

      {/* كروت — موبايل */}
      <div className="md:hidden space-y-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 p-3 flex gap-3"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <Image
                src={coverImage(p)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-700 line-clamp-1">{p.title}</p>
              <p className="text-[#1e3a8a] font-extrabold text-sm mt-1">
                {formatPrice(p.price)} {t("egp")}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {p.governorate} — {p.city} · {p.listing_type === "sale" ? t("sale") : t("rent")}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditing(p)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                >
                  <Pencil size={13} />
                  {t("edit")}
                </button>
                <button
                  onClick={() => remove(p.id)}
                  disabled={busy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold"
                >
                  <Trash2 size={13} />
                  {t("deleteProperty")}
                </button>
                <button
                  onClick={() => togglePublished(p)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    p.is_published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                  {p.is_published ? "منشور" : "مسودة"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-slate-400 py-12">{t("noProperties")}</p>
        )}
      </div>
    </div>
  );
}
