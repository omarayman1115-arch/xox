# دليل تشغيل xox 🏠

موقع تسويق عقاري عربي/إنجليزي — Next.js 15 + Supabase + Vercel.

---

## 1) تشغيل الموقع محلياً

```bash
npm install
npm run dev
```

افتح: http://localhost:3000

> الموقع شغال من الأول ببيانات تجريبية (12 عقار) من غير أي إعداد — عشان تجرب كل حاجة.

---

## 2) ربط Supabase (عشان الإعلانات والصور الحقيقية)

### أ) اعمل مشروع
1. ادخل على [supabase.com](https://supabase.com) → **New project**
2. اختار اسم (مثلاً `xox`) وكلمة سر لقاعدة البيانات و Region: Frankfurt أو closest
3. استنى دقيقة لحد ما المشروع يجهز

### ب) نفّذ السكيمة
1. من القائمة الجانبية: **SQL Editor** → **New query**
2. انسخ محتوى ملف `supabase/schema.sql` كله والصقه واضغط **Run**
3. ده هيعمل: جدول `properties` + الحماية (RLS) + bucket الصور `property-images`

### ج) هات المفاتيح
1. **Project Settings → API**
2. هتلاقي:
   - `Project URL` → ده `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → ده `NEXT_PUBLIC_SUPABABASE_ANON_KEY`

### د) حطهم في `.env.local`
اعمل ملف اسمه `.env.local` في جذر المشروع:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ADMIN_PASSWORD=كلمة_سر_قوية_هنا
NEXT_PUBLIC_DEFAULT_WHATSAPP=201556956343
```

وبعدين أعد تشغيل `npm run dev`.

> **أول ما تربط Supabase:** امسح العقارات التجريبية من لوحة التحكم وأضف عقاراتك.

---

## 3) لوحة التحكم (الأدمن بيدج)

- الرابط: **`/admin`**
- كلمة السر الافتراضية: `change-me-to-a-strong-password` (غيّرها في `.env.local` عبر `ADMIN_PASSWORD`)
- تقدر: إضافة/تعديل/حذف عقار، رفع صور بالسحب والإفلات، تحديد صورة رئيسية، نشر/إخفاء (مسودة)، تمييز عقار ⭐

> ⚠️ **مهم:** لو نسيت كلمة السر غيّر `ADMIN_PASSWORD` في `.env.local` (أو Environment Variables في Vercel) وأعد النشر.

---

## 4) النشر على Vercel

### أ) ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "xox real estate site"
git remote add origin https://github.com/USERNAME/xox.git
git push -u origin main
```

### ب) على Vercel
1. [vercel.com](https://vercel.com) → **Add New → Project** → اختار الريبو
2. **قبل ما تدوس Deploy** → افتح **Environment Variables** وضيف:

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | من Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | من Supabase |
| `ADMIN_PASSWORD` | كلمة سر قوية |
| `NEXT_PUBLIC_SITE_URL` | رابط موقعك (مثلاً `https://xox.vercel.app`) |
| `NEXT_PUBLIC_DEFAULT_WHATSAPP` | `201556956343` |

3. دوس **Deploy** وخلصنا 🎉

### ج) بعد النشر
- ادخل على `https://موقعك/sitemap.xml` — هتلاقي كل العقارات
- ارفع الموقع في [Google Search Console](https://search.google.com/search-console) واعمل "Request Indexing" للصفحة الرئيسية — دي أهم خطوة SEO
- أي تعديل جديد تعمله وتبعته لـ GitHub هينزل أوتوماتيك على الموقع

---

## 5) إزاي تضيف عقار (مختصر)

1. `/admin` → كلمة السر → **إضافة عقار**
2. املأ: العنوان، نوع العرض (بيع/إيجار)، النوع، السعر، المحافظة/المدينة/المنطقة (قوائم متتالية)، المساحة، الغرف، الحمامات، الوصف، المميزات، الصور (سحب وإفلات)، رقمك
3. احفظ — العقار هيظهر فوراً في الموقع وفي الـ sitemap

---

## المزايا الموجودة

- ✅ **صفحتين بس**: الصفحة العادية `/` فيها الفلتر وكل العقارات وتفاصيل أي عقار تفتح في نافذة (Modal) من غير تنقل + `/admin` لوحة التحكم
- ✅ رابط `/properties/ID` لسه موجود في الخلفية (للمشاركة على واتساب وSEO) — بيفتح الصفحة الرئيسية مع نافذة العقار مفتوحة
- ✅ عربي RTL + إنجليزي (زرار تبديل في الهيدر، بيتحفظ)
- ✅ فلتر OLX ستايل: تبويبات بيع/إيجار + المحافظة → المدينة → المنطقة (قوائم متتالية) + نوع العقار + السعر من/إلى + المساحة من/إلى + غرف X+ + حمامات X+ + ترتيب (الأحدث/الأغلى/الأرخص/الأكبر)
- ✅ بوتوم شيت فلاتر للموبايل مع عداد فلاتر مفعّلة وزرار "عرض النتائج (عدد)"
- ✅ مفضلة بقلب على الكارت + عرضها على نفس الصفحة (/?fav=1) + عداد في الهيدر (محفوظة في المتصفح)
- ✅ صفحة عقار: معرض صور، مواصفات، مميزات، وصف، زرار واتساب برسالة جاهزة + اتصال + شريط ثابت على الموبايل
- ✅ أدمن بيدج محمية: جدول + كروت موبايل + إضافة/تعديل/حذف + مسودة/نشر + تمييز
- ✅ رفع صور على Supabase Storage (سحب وإفلات + معاينة + صورة رئيسية)
- ✅ SEO: metadata كاملة، Open Graph/Twitter، JSON-LD (WebSite + RealEstateAgent + Product لكل عقار)، sitemap.xml ديناميكي، robots.txt، صفحات ديناميكية بعناوين وأوصاف لكل عقار
- ✅ Mobile-first: أزرار كبيرة، بوتوم شيت، شريط تواصل ثابت، خط Cairo، أنيميشن خفيف
