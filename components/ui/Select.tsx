"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

/**
 * select موحد الشكل في الموقع كله:
 * - شيلنا سهم المتصفح الافتراضي (شكله بيختلف من Chrome لـ Safari)
 * - رسمنا سهم SVG متمركز عمودياً على الجهة المنطقية الأخيرة (شمال في RTL — يمين في LTR)
 * - padding من الجهة دي ثابت عشان النص ما يتراكبش فوق السهم أبداً
 */
export default function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={`appearance-none w-full px-4 py-3 pe-10 rounded-xl border border-slate-300 bg-surface-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer transition-colors ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={17}
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
