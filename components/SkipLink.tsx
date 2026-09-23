"use client";

import { useLang } from "@/lib/i18n";

/** رابط تخطي المحتوى للكيبورد — بيتغير حسب اللغة */
export default function SkipLink() {
  const { lang } = useLang();
  return (
    <a href="#main" className="skip-link">
      {lang === "ar" ? "تخطي إلى المحتوى" : "Skip to content"}
    </a>
  );
}
