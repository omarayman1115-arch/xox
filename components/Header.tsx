"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, X, Languages, Building2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useFav } from "./FavoritesProvider";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { ids } = useFav();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("allProperties") },
    { href: "/?fav=1", label: t("favorites") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* اللوجو */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="w-9 h-9 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center">
            <Building2 size={20} />
          </span>
          <span className="text-2xl font-extrabold text-[#1e3a8a] tracking-tight" dir="ltr">
            xox
          </span>
        </Link>

        {/* روابط الديسكتوب */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === l.href
                  ? "bg-[#1e3a8a]/10 text-[#1e3a8a]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#1e3a8a]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* الأيقونات */}
        <div className="flex items-center gap-2">
          <Link
            href="/?fav=1"
            className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label={t("favorites")}
          >
            <Heart size={22} className="text-slate-600" />
            {ids.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                {ids.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Switch language"
          >
            <Languages size={18} />
            {lang === "ar" ? "EN" : "ع"}
          </button>

          {/* زرار الموبايل */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2.5 rounded-lg hover:bg-slate-100"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {open && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg font-semibold ${
                pathname === l.href ? "bg-[#1e3a8a]/10 text-[#1e3a8a]" : "text-slate-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
