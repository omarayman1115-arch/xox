"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function ThemeToggle() {
  const { lang } = useLang();
  const [light, setLight] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
    setReady(true);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("xox-theme", next ? "light" : "dark");
    } catch {
      /* تجاهل */
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors"
      aria-label={light ? (lang === "ar" ? "الوضع الداكن" : "Dark mode") : (lang === "ar" ? "الوضع الفاتح" : "Light mode")}
      title={light ? (lang === "ar" ? "الوضع الداكن" : "Dark mode") : (lang === "ar" ? "الوضع الفاتح" : "Light mode")}
    >
      {ready && light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
