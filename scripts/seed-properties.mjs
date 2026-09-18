// رفع صور العقارات على Supabase Storage + إنشاء 5 عقارات جاهزة
// التشغيل: node scripts/seed-properties.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("✗ ناقص مفاتيح Supabase في .env.local");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "property-images";

// الصور الخمسة اللي بعتها المستخدم (غرف معيشة بتشطيبات مختلفة)
const IMAGES = [
  "C:/Users/FT 2026/Documents/WhatsApp1 Image 2026-09-17 at 2.08.57 PM.jpeg",
  "C:/Users/FT 2026/Documents/WhatsApp2 Image 2026-09-17 at 2.08.57 PM.jpeg",
  "C:/Users/FT 2026/Documents/WhatsApp3 Image 2026-09-17 at 2.08.57 PM.jpeg",
  "C:/Users/FT 2026/Downloads/WhatsApp4 Image 2026-09-17 at 2.08.57 PM.jpeg",
  "C:/Users/FT 2026/Downloads/WhatsApp6 Image 2026-09-17 at 2.08.58 PM.jpeg",
];

const PHONE = "01151707244";

const PROPS = [
  {
    title: "شقة 165م مفروشة بالكامل — الحي الخامس، التجمع",
    listing_type: "sale",
    rent_period: null,
    property_type: "شقة",
    price: 4200000,
    governorate: "القاهرة",
    city: "التجمع الخامس",
    district: "الحي الخامس",
    area: 165,
    bedrooms: 3,
    bathrooms: 2,
    is_featured: true,
    features: ["مطبخ مجهز", "تكييف مركزي", "أمن وحراسة", "جراج خاص", "مصعد"],
    description:
      "شقة مفروشة فرش مودرن بالكامل — ريسبشن 3 قطع بإضاءة مخفية وتصميم مفتوح، أكلات وسفرة فاخرة. الاستلام فوري وسكن على طول، قريبة من المدارس والمولات والخدمات في قلب التجمع الخامس.",
    image: 0,
  },
  {
    title: "شقة 140م تشطيب سوبر لوكس — الشيخ زايد",
    listing_type: "sale",
    rent_period: null,
    property_type: "شقة",
    price: 3350000,
    governorate: "الجيزة",
    city: "الشيخ زايد",
    district: "الحي الثالث",
    area: 140,
    bedrooms: 3,
    bathrooms: 2,
    is_featured: false,
    features: ["مصعد", "إنترنت فايبر", "شرفة واسعة", "قريب من المواصلات"],
    description:
      "شقة سوبر لوكس بتشطيب عصري وإضاءة LED مخفية في السقف، ريسبشن كبير ومطبخ أمريكي. موقع متميز في الشيخ زايد قريب من الخدمات والمحاور الرئيسية.",
    image: 1,
  },
  {
    title: "شقة 120م بإطلالة مفتوحة — المهندسين",
    listing_type: "sale",
    rent_period: null,
    property_type: "شقة",
    price: 2750000,
    governorate: "الجيزة",
    city: "المهندسين",
    district: "يزيد",
    area: 120,
    bedrooms: 2,
    bathrooms: 2,
    is_featured: false,
    features: ["مصعد", "شرفة واسعة", "قريب من المواصلات"],
    description:
      "شقة مرتبة وجاهزة للسكن بتصميم دافئ وإضاءة مخفية، في شارع هادي بمهندسين قريب من الجامعة والمواصلات ومنطقة الخدمات.",
    image: 2,
  },
  {
    title: "شقة 150م فرش كامل للإيجار — النزهة، مدينة نصر",
    listing_type: "rent",
    rent_period: "monthly",
    property_type: "شقة",
    price: 18000,
    governorate: "القاهرة",
    city: "مدينة نصر",
    district: "النزهة",
    area: 150,
    bedrooms: 3,
    bathrooms: 2,
    is_featured: true,
    features: ["مطبخ مجهز", "تكييف مركزي", "مصعد", "أمن وحراسة"],
    description:
      "شقة مفروشة إيجار شهري بفرش كويس جداً — كنبات موبايلات كامل وديكور جبس بإضاءة مخفية. مناسبة لعائلة صغيرة أو تنفيذيين، بحارة هادية وجار بنات مرتبين.",
    image: 3,
  },
  {
    title: "شقة 180م استلام فوري — المعادي الجديدة",
    listing_type: "sale",
    rent_period: null,
    property_type: "شقة",
    price: 4900000,
    governorate: "القاهرة",
    city: "المعادي",
    district: "المعادي الجديدة",
    area: 180,
    bedrooms: 4,
    bathrooms: 3,
    is_featured: false,
    features: ["جراج خاص", "حديقة", "أمن وحراسة", "مطبخ مجهز", "مصعد"],
    description:
      "شقة واسعة 180م في كومباوند بالمعادي الجديدة، ريسبشن 4 قطع بتقسيمة مريحة وتشطيب كلاسيك مودرن. استلام فوري مع جراج وحصة في الحديقة.",
    image: 4,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;

for (const p of PROPS) {
  // تجاهل لو العنوان موجود خلاص (تكرار تشغيل آمن)
  const { data: existing } = await sb
    .from("xox_properties")
    .select("id")
    .eq("title", p.title)
    .maybeSingle();
  if (existing) {
    console.log(`↷ موجود بالفعل: ${p.title}`);
    ok++;
    continue;
  }

  // رفع الصورة
  const imgPath = IMAGES[p.image];
  let publicUrl = null;
  try {
    const buf = readFileSync(imgPath);
    const name = `seed/whatsapp-${p.image + 1}.jpg`;
    const up = await sb.storage.from(BUCKET).upload(name, buf, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (up.error) {
      console.error(`✗ رفع الصورة فشل (${imgPath}):`, up.error.message);
      continue;
    }
    publicUrl = sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  } catch (e) {
    console.error(`✗ قراءة الصورة فشل (${imgPath}):`, e.message);
    continue;
  }

  const { error } = await sb.from("xox_properties").insert({
    listing_type: p.listing_type,
    rent_period: p.rent_period,
    property_type: p.property_type,
    title: p.title,
    description: p.description,
    price: p.price,
    governorate: p.governorate,
    city: p.city,
    district: p.district,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    features: p.features,
    images: [publicUrl],
    contact_phone: PHONE,
    is_featured: p.is_featured,
    is_published: true,
  });

  if (error) {
    console.error(`✗ إدخال العقار فشل (${p.title}):`, error.message);
  } else {
    console.log(`✓ اتضاف: ${p.title}`);
    ok++;
  }
  await sleep(300);
}

console.log(`\nتم: ${ok}/${PROPS.length} عقار جاهز في قاعدة البيانات.`);
