"use client";

import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  const wa = "https://wa.me/201151707244";

  return (
    <footer className="bg-[#172554] text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        {/* عن الموقع */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-extrabold text-white" dir="ltr">
              xox
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            {t("heroSubtitle")} — {t("madeWithLove")} 💙
          </p>
        </div>

        {/* روابط سريعة */}
        <div>
          <h3 className="font-bold text-white mb-3">{t("quickLinks")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                {t("allProperties")}
              </Link>
            </li>
            <li>
              <Link href="/?fav=1" className="hover:text-white transition-colors">
                {t("favorites")}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-white transition-colors">
                {t("dashboard")}
              </Link>
            </li>
          </ul>
        </div>

        {/* التواصل */}
        <div>
          <h3 className="font-bold text-white mb-3">{t("reachUs")}</h3>
          <div className="space-y-3 text-sm">
            <a
              href="tel:+201151707244"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone size={16} />
              <span dir="ltr">+20 115 170 7244</span>
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
