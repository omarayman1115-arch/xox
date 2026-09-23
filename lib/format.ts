import type { Property } from "./types";

/** تنسيق السعر: 2750000 → 2,750,000 */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** تنسيق التاريخ حسب اللغة */
export function formatDate(iso: string, lang: "ar" | "en"): string {
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** رقم الهاتف بصيغة دولية للواتساب: 01556956343 → 201556956343 */
export function toWhatsAppNumber(phone: string): string {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("0")) p = "20" + p.slice(1);
  if (!p.startsWith("20") && p.length === 10) p = "20" + p;
  return p;
}

/** رابط واتساب برسالة جاهزة عن العقار */
export function whatsappLink(phone: string, property?: Property): string {
  const num = toWhatsAppNumber(phone);
  const msg = property
    ? `مرحباً، مهتم بـ: ${property.title}\nالسعر: ${formatPrice(property.price)} ج.م\nمن موقع xox`
    : "مرحباً، عندي استفسار من موقع xox";
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

/** صورة العقار الأولى أو بديل */
export function coverImage(p: Property): string {
  return p.images?.[0] ?? "https://picsum.photos/seed/xox-fallback/800/600";
}

/** مصفوفة صور آمنة */
export function safeImages(p: Property): string[] {
  return p.images && p.images.length > 0 ? p.images : ["https://picsum.photos/seed/xox-fallback/800/600"];
}

/* ---------- أنواع فيديو العقار ---------- */

export type VideoKind = "file" | "tiktok" | "youtube" | "instagram" | "facebook" | "link" | null;

/**
 * تحديد نوع رابط الفيديو:
 * - file: ملف فيديو مباشر (mp4/webm/mov) — يتشغل في مشغل الموقع
 * - tiktok/youtube/instagram/facebook: لينك منصة — يتشغل جوه الموقع بمشغّلها
 * - link: أي رابط تاني — زرار يفتحه في تاب جديد
 */
export function videoKind(url: string | null | undefined): VideoKind {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/.test(u)) return "file";
  if (/tiktok\.com|vm\.tiktok/.test(u)) return "tiktok";
  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/instagram\.com\/(p|reel|tv)\//.test(u)) return "instagram";
  if (/facebook\.com|fb\.watch/.test(u)) return "facebook";
  if (/^https?:\/\//.test(u)) return "link";
  return null;
}

/** استخراج معرف الفيديو من رابط يوتيوب (عشان الـ embed) */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * رابط embed لكل منصة — التشغيل جوه الموقع من غير ما الزائر يسيبه.
 * ملاحظة: انستجرام وفيسبوك بيستخدموا iframe رسمي بسيط.
 */
export function videoEmbedUrl(url: string, kind: VideoKind): string | null {
  switch (kind) {
    case "youtube": {
      const id = youtubeId(url);
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    case "tiktok": {
      // TikTok embed الرسمي — بيشتغل مع لينكات /video/ و /v/
      // لينكات vm.tiktok.com المختصرة معندهاش ID — نرجّع null فيظهر زرار بدل iframe مكسور
      const ttId = url.match(/\/(?:video|v)\/(\d+)/)?.[1];
      return ttId ? `https://www.tiktok.com/embed/v2/${ttId}` : null;
    }
    case "instagram":
      return `${url.replace(/\?[^?]*$/, "")}/embed`;
    case "facebook":
      // fb.watch المختصرة مش بتشتغل مع بلوجن فيسبوك — نرجّع null فيظهر زرار
      if (/fb\.watch/.test(url)) return null;
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    default:
      return null;
  }
}

/** اسم المنصة بالعربي/الإنجليزي لعرضه على زرار المشاهدة */
export function videoPlatformName(kind: VideoKind, lang: "ar" | "en"): string {
  const names: Record<string, [string, string]> = {
    tiktok: ["تيك توك", "TikTok"],
    youtube: ["يوتيوب", "YouTube"],
    instagram: ["انستجرام", "Instagram"],
    facebook: ["فيسبوك", "Facebook"],
    link: ["الرابط", "link"],
  };
  const n = kind ? names[kind] : null;
  return n ? (lang === "ar" ? n[0] : n[1]) : "";
}
