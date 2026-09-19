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
