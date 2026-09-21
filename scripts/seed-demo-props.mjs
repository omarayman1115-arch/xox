// إدخال عقارات تجريبية متنوعة الأنواع — الصور من public/demo
// التشغيل: node scripts/seed-demo-props.mjs
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
const PHONE = "01556956343";

// الصور — من فولدر public/demo (جايين من المستخدم)
const IMG = (n) => readFileSync(new URL(`../public/demo/apt-${n}.jpg`, import.meta.url));

const PROPS = [
  {
    title: "فيلا 350م بحديقة خاصة — الشيخ زايد",
    listing_type: "sale",
    rent_period: null,
    property_type: "فيلا",
    price: 12500000,
    governorate: "الجيزة",
    city: "الشيخ زايد",
    district: "الحي الثامن",
    area: 350,
    bedrooms: 5,
    bathrooms: 4,
    is_featured: true,
    features: ["حديقة خاصة", "جراج خاص", "أمن وحراسة", "تكييف مركزي", "مطبخ مجهز"],
    description:
      "فيلا مستقلة تشطيب كلاسيك مودرن — ريسبشن كبير بإضاءة مخفية وصالون طعام منفصل، مطبخ أمريكي مجهز بالكامل، 5 غرف نوم منهم سويت رئيسية بحمام خاص. حديقة خلفية واسعة وجاراج خاص، الكمبوند بأمن وحراسة 24 ساعة ونادي وخدمات.",
    images: [1, 4],
  },
  {
    title: "شاليه 120م بإطلالة بحر — الساحل الشمالي",
    listing_type: "sale",
    rent_period: null,
    property_type: "شاليه",
    price: 5800000,
    governorate: "مطروح",
    city: "الساحل الشمالي",
    district: "سيدي عبد الرحمن",
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    is_featured: true,
    features: ["إطلالة بحر", "أمن وحراسة", "مطبخ مجهز", "تكييفات", "جراج"],
    description:
      "شاليه بتراس واسع بإطلالة بحر مباشرة — فرش مودرن كامل بألوان هادية، ريسبشن مفتوح على التراس، مطبخ مجهز و3 غرف نوم. القرية فيها بحيرات صناعية ومطاعم وأمن طوال السنة، مشوار البحر دقيقتين.",
    images: [2, 5],
  },
  {
    title: "محل تجاري 85م على شارع رئيسي — مدينة نصر",
    listing_type: "rent",
    rent_period: "monthly",
    property_type: "محل تجاري",
    price: 35000,
    governorate: "القاهرة",
    city: "مدينة نصر",
    district: "النزهة الجديدة",
    area: 85,
    bedrooms: 0,
    bathrooms: 1,
    is_featured: false,
    features: ["واجهة زجاج", "حيازة", "تكييف مركزي", "أمن"],
    description:
      "محل بواجهة زجاج 8 متر على شارع رئيسي بحركة عالية — مناسب كافيه أو صيدلية أو معرض. الحيازة جديدة ودور أرضي، فيثنتين وتكييف مركزي، ومكان لكل عربيات.",
    images: [3, 6],
  },
  {
    title: "شقة دوبلكس 240م — التجمع الخامس",
    listing_type: "sale",
    rent_period: null,
    property_type: "دوبلكس",
    price: 7900000,
    governorate: "القاهرة",
    city: "التجمع الخامس",
    district: "الحي الأول",
    area: 240,
    bedrooms: 4,
    bathrooms: 3,
    is_featured: false,
    features: ["مصعد", "جراج خاص", "أمن وحراسة", "مطبخ مجهز", "تكييفات"],
    description:
      "دوبلكس بفيو مفتوح — دور أرضي ريسبشن وضيوف ومطبخ أمريكي، والدور الأول 3 غرف نوم منهم سويت رئيسية. تشطيب سوبر لوكس بإضاءة سبوت مخفية، الكمبوند بخدمات كاملة وجراج خاص.",
    images: [7, 8],
  },
  {
    title: "استوديو مفروش 60م للميباع — المهندسين",
    listing_type: "rent",
    rent_period: "monthly",
    property_type: "ستوديو",
    price: 12000,
    governorate: "الجيزة",
    city: "الجيزة",
    district: "المهندسين",
    area: 60,
    bedrooms: 1,
    bathrooms: 1,
    is_featured: false,
    features: ["فرش كامل", "مطبخ مجهز", "مصعد", "إنترنت"],
    description:
      "استوديو مفروش فرش كامل مناسب لشخص أو شخصين — مساحة نوم وريسبشن مفتوحين، مطبخ صغير مجهز وحمام مودرن. الدور الثالث بمصعد، قريب من الجامعة والمواصلات وشارع الخدمات، الإيجار شهري شامل.",
    images: [9],
  },
  {
    title: "مكتب إداري 110م بتقسيمة مودرن — العاصمة الإدارية",
    listing_type: "rent",
    rent_period: "monthly",
    property_type: "مكتب إداري",
    price: 28000,
    governorate: "القاهرة",
    city: "العاصمة الإدارية",
    district: "الحي المالي",
    area: 110,
    bedrooms: 0,
    bathrooms: 2,
    is_featured: false,
    features: ["تكييف مركزي", "أمن وحراسة", "جراج", "إنترنت", "مصعد"],
    description:
      "مكتب إداري بتقسيمة مودرن في برج تجاري بالحي المالي — استقبال وغرفتين اجتماعات ومساحة عمل مفتوحة. تكييف مركزي وإنترنت فايبر وأمن 24 ساعة، وقوف سيارات خاصة للعمارات.",
    images: [4, 2],
  },
];

let ok = 0;
for (const p of PROPS) {
  // تجاهل لو العنوان موجود خلاص (تكرار تشغيل آمن)
  const { data: existing } = await sb.from("xox_properties").select("id").eq("title", p.title).maybeSingle();
  if (existing) {
    console.log(`↷ موجود بالفعل: ${p.title}`);
    ok++;
    continue;
  }

  // رفع الصور
  const urls = [];
  for (const n of p.images) {
    const name = `demo/apt-${n}.jpg`;
    try {
      const up = await sb.storage.from(BUCKET).upload(name, IMG(n), { contentType: "image/jpeg", upsert: true });
      if (up.error) {
        console.error(`✗ رفع الصورة apt-${n} فشل:`, up.error.message);
        continue;
      }
      urls.push(sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl);
    } catch (e) {
      console.error(`✗ قراءة الصورة apt-${n} فشل:`, e.message);
    }
  }
  if (urls.length === 0) {
    console.error(`✗ ${p.title}: مفيش صور اترفعت — تجاهل`);
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
    images: urls,
    contact_phone: PHONE,
    is_featured: p.is_featured,
    is_published: true,
  });

  if (error) {
    console.error(`✗ إدخال العقار فشل (${p.title}):`, error.message);
    continue;
  }
  console.log(`✓ ${p.title} — ${urls.length} صورة`);
  ok++;
}

console.log(`\nتم: ${ok}/${PROPS.length}`);
