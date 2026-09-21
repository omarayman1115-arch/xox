"use client";

import { Phone, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  const wa = "https://wa.me/201556956343";

  return (
    <footer className="bg-surface border-t border-slate-200 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-2">
        {/* عن الموقع */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-extrabold text-white" dir="ltr">
              xox
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            {t("madeWithLove")} — {t("heroSubtitle")}
          </p>
        </div>

        {/* التواصل */}
        <div>
          <h3 className="font-bold text-white mb-3">{t("reachUs")}</h3>
          <div className="space-y-3 text-sm">
            <a
              href="tel:+201556956343"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone size={16} />
              <span dir="ltr">+20 155 695 6343</span>
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <MessageCircle size={16} />
              {t("whatsappNumber")}
            </a>
            <p className="text-slate-400">{t("egypt")} 🇪🇬</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} xox — {t("copyright")}
      </div>
    </footer>
  );
}
