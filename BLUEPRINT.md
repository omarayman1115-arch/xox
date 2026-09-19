# 🏗️ بلوبرنت بناء الموقع — كل اللي اتعلم في 3 أيام في ملف واحد

> **إزاي تستخدمه:** في أي مشروع جديد، انسخ الملف ده وابعته في **أول رسالة**، وبعدها جاوب على أسئلة **القسم 10** بس — وخلاص، نبدأ بناء من أول 10 دقايق.

---

## 1) الستاك الثابت (قرار متبع — متسألش عنه تاني)

| الطبقة | الأداة |
|---|---|
| الفريمورك | **Next.js 15** (App Router) + **TypeScript** |
| التنسيق | **Tailwind CSS v4** (`@import "tailwindcss"` في globals.css) |
| قاعدة البيانات | **Supabase** (Postgres + Auth + Storage) |
| الاستضافة | **Vercel** — مربوط بـ GitHub: كل `git push` = نشر تلقائي |
| الخط | **Cairo** من Google Fonts عبر `next/font` |
| الأيقونات | `lucide-react` |
| الاتجاه | **عربي RTL أساسي** + تبديل إنجليزي محفوظ في localStorage |

**أنماط التصميم الكاملة** (ألوان، زوايا، بادجات، قواعد RTL، dropdowns): موجودة في **`.codebuff/skills/xox-ui-ux.md`** — انسخه مع أي مشروع جديد، هو المرجع الرسمي للشكل.

---

## 2) هيكل المشروع

```
app/
  page.tsx                  → الرئيسية (تحميل العقارات + HomeView)
  admin/page.tsx            → لوحة التحكم (دخول + جدول/كروت + CRUD)
  admin/leads/page.tsx      → العملاء المهتمين (جدول + فلاتر + ملاحظات)
  properties/[id]/page.tsx  → صفحة عقار مستقلة (SEO كامل)
  favorites/page.tsx        → تحويل 307 إلى /?fav=1 (ممنوع 404)
  properties/page.tsx       → تحويل 307 إلى / (لـ SearchAction)
  sitemap.ts + robots.ts    → SEO
  api/leads/route.ts        → POST عام (زوار) — من السيرفر بمفتاح الخدمة
  api/admin/login/route.ts  → جلسة الأدمن (توكن + كوكي)
  api/admin/properties/route.ts + [id]/route.ts → CRUD محمي
  api/admin/leads/route.ts  → قراءة/PATCH الليدز (حالة + ملاحظة)
  api/upload/route.ts       → رفع صور (service_role)
components/
  HomeView, FilterBar, PropertyCard, PropertyModal (معرض بأسهم),
  LeadModal (فورم قبل واتساب), Header, Footer, FavoritesView, ui/Select
lib/
  types.ts, supabase.ts, supabaseAdmin.ts, adminFetch.ts,
  i18n.tsx (عربي/إنجليزي), format.ts (سعر/تاريخ), egypt.ts (محافظات)
supabase/
  schema.sql, leads-schema.sql, leads-note.sql   → تنفيذ يدوي من SQL Editor
scripts/
  sync-admin-password.mjs   → مزامنة ADMIN_PASSWORD مع Supabase Auth
```

---

## 3) قاعدة البيانات — السكيمة الجاهزة

**الوحدات/العقارات (`units`):**
`id uuid, code, title, location, area int, beds, baths, floor, finishing, price bigint, down_payment, years, featured bool, description, photo_url, images jsonb, published bool, created_at`

**الليدز (`leads`):**
`id uuid, property_id uuid → units(id), customer_name, phone_number, status text default 'not_contacted', note text default '', last_contact timestamptz, created_at`

**الإعدادات (`settings`):** صف واحد `id=1` فيه `whatsapp, brand, tagline`.

**قواعد RLS الثابتة:**
- `units`: select عام للمنشور — الكتابة **من الـ API فقط** (service_role يتخطى RLS)
- `leads`: `insert with check (true)` للزوار — **القراءة/التعديل للسيرفر فقط** (بيانات عملاء متتسربش)
- `settings`: select عام
- Storage: bucket عام (مثلاً `unit-photos`) — الرفع من الـ API، القراءة عامة

---

## 4) الأمان — النمط الكامل

1. مستخدم أدمن واحد في **Supabase Auth** (إيميل + ADMIN_PASSWORD)
2. `/api/admin/login` → يفتح جلسة ويرجع `access_token` + كوكي
3. كل `/api/admin/*` بتستدعي `requireAdmin` (يقبل Bearer أو كوكي)
4. **إدخال الليدز من الزوار: من الـ API route بالسيرفر بمفتاح الخدمة** — مش مباشرة من المتصفح (سياسات RLS بتمنع الـ `returning` للـ anon وبيبان خطأ غلط للمستخدم)
5. ملفات البيئة **مش بتتكومت أبداً** — `.env.local` في `.gitignore`

---

## 5) الواجهة — مكونات جاهزة للنسخ (موجودة كلها في XOX)

| المكوّن | النقطة المهمة |
|---|---|
| `FilterBar` | تبويبات بيع/إيجار + dropdowns مخصصة — **ممنوع `overflow-x-auto`** (بيقص القوائم) |
| `PropertyModal` | معرض صور: مصغرات قابلة للضغط + أسهم **بتختفي عند أول/آخر صورة** + عداد `dir="ltr"` + أسهم كيبورد |
| اتجاه الأسهم RTL | سهم "التالية" **على الشمال**، "السابقة" على اليمين — وعكسها في الإنجليزي |
| `LeadModal` | واتساب → فورم اسم/تليفون → POST → رسالة نجاح → واتساب يفتح تلقائياً برسالة جاهزة |
| Skeletons | لكل قائمة بتجيب بيانات + **رسالة خطأ عربية** وزرار "حاول تاني" |
| Favorites | قلب على الكارت + صفحة + عداد في الهيدر (localStorage) |
| `ui/Select` | select موحّد بسهم SVG يدوي بيتجه مع RTL + شريط تمرير رفيع (`.thin-scrollbar`) |

---

## 6) SEO — Checklist الجاهز

- `metadata` في layout + `generateMetadata` لصفحة العقار (عنوان، وصف، OG image)
- **JSON-LD `RealEstateListing`** في صفحة العقار (سعر/عملة/مساحة/عنوان)
- `sitemap.ts` بيولد روابط العقارات تلقائياً + `robots.ts` بيمنع `/admin` و`/api`
- مفيش أي رابط داخلي يؤدي على 404 (الصفحات الناقصة تتعمل كتحويل 307)
- `NEXT_PUBLIC_SITE_URL` للروابط المطلقة في sitemap وOG

---

## 7) ملف البيئة `.env.local` (املا الفراغات بنفسك)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://______.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=______        # sb_publishable_...
SUPABASE_SECRET_KEY=______                  # sb_secret_... (سري — سيرفر فقط)
ADMIN_PASSWORD=______
ADMIN_EMAIL=______@______.com
NEXT_PUBLIC_DEFAULT_WHATSAPP=______         # برقم الدولة بدون +
NEXT_PUBLIC_SITE_URL=https://______
```
> نفس القيم الستة بالظبط تتضاف في **Vercel → Settings → Environment Variables**.

---

## 8) رن بوك النشر — بالترتيب حرفياً (متنقلش بين المراحل)

**مرحلة 1 — Supabase (~15 د):** New project → SQL Editor: نفّذ `schema.sql` ثم `leads-schema.sql` (تبويب فاضي، لصق، Run) → Storage: New bucket عام → copy المفتاحين.

**مرحلة 2 — محلي (~15 د):** `npm install` → املا `.env.local` → `node scripts/sync-admin-password.mjs` → `npm run dev` → جرّب: رئيسية، فلاتر، عقار، فورم ليد، `/admin`.

**مرحلة 3 — GitHub (~5 د):** repo جديد → `git init` → `git add .` → commit → `git push -u origin main` → **هتظهر نافذة تسجيل دخول GitHub — ده طبيعي، سجل فيها.**

**مرحلة 4 — Vercel (~10 د):** Add New Project → Import الـ repo → في Environment Variables حط الـ 6 قيم → Deploy → استنى READY.

**مرحلة 5 — فحص اللايف (~10 د):** الرئيسية 200 ✓ فورم ليد من الموبايل ✓ ظهوره في `/admin/leads` ✓ دخول الأدمن ✓ APIs بدون تسجيل = 401 ✓ sitemap ✓ → **وامسح توكن Vercel المؤقت بعد الخلاص.**

---

## 9) ⚠️ فخاخ اتبُنّت بألم — متتعملش تاني

1. **متعملش `next build` والـ dev شغال** على نفس فولدر `.next` — بيبوّظ السيرفر (اعمله ريستارت بعدها)
2. **ممنوع `overflow-x-auto`** على شريط فيه dropdowns — القايمة بتفتح مقصوصة مخفية وتبان "مش بتفتح"
3. **الإدخال للقاعدة من الزائر: من الـ API بس** — الـ anon مش بيقدر يعمل returning بسبب RLS (بيطلع "حدث خطأ" غلط والحفظ نجح فعلاً)
4. بعد أي `git push`: **اتأكد إن اللايف اتحدث فعلاً** (افتح الموقع)
5. بورت 3000 ممكن يكون مشغول من عملية قديمة — نضّفه قبل ما تلمّ
6. عربي الترمينال على ويندوز بيتلخبط في العرض — **البيانات في القاعدة سليمة**، متتلغبطش
7. كل مرة السيرفر يقع: شيك اللوج في `.freebuff/` قبل ما تعيد التشغيل بالتجربة والخطأ

---

## 10) 🎤 أسئلة بداية المشروع — جاوب عليها قبل أي سطر كود

**البيزنس:**
1. الموقع بيع/يخدم إيه بالظبط؟ (لو عقارات: بيع/إيجار؟ أي مناطق؟)
2. عندك بيانات وصور حقيقية جاهزة ولا نبدأ ببيانات تجريبية؟
3. الزائر بيعمل إيه لما يعجبه شيء؟ (واتساب؟ فورم؟ اتصال؟)

**البراند:**
4. اسم الموقع؟ 5. ألوان تفضيلية؟ (الافتراضي: أزرق ملكي `#1e3a8a` + ذهبي `#f59e0b`) 6. لوجو؟ 7. رقم واتساب الأعمال؟

**الوظائف:**
8. الفلاتر المطلوبة بالظبط؟ (نوع، موقع، سعر، غرف، مساحة…)
9. لوحة تحكم محتاجة فيها إيه؟ (عقارات؟ ليدز بملاحظات؟ إعدادات؟)
10. إشعار لما ييجي عميل جديد — عايزه إزاي؟ (لوحة بس / إيميل / واتساب)
11. مفضلة أو مقارنة؟ تعدد لغات؟

**التقني والتسويق:**
12. دومين جاهز ولا هنشتري؟ 13. حسابات GitHub/Supabase/Vercel موجودة؟
14. الكلمات المستهدفة في جوجل (مدينة/نوع العقار)؟ 15. Google Analytics / Search Console؟

---

## 11) قواعد التشغيل المحلي

- Dev دايماً على `http://localhost:3000` لو البورت فاضي — لو اشتغل على بورت تاني اتأكد إن `run.md` اتحدث
- ملف `.freebuff/run.md` بيتم تحديثه مع كل تغيير تشغيلي
- أي تغيير جديد: `npx tsc --noEmit` قبل الـ commit

---

## 12) 🗓️ دليل التشغيل اليومي — إزاي تدير الموقع بنفسك بعد الإطلاق

| عايز إيه؟ | تعمل إيه؟ |
|---|---|
| تضيف عقار جديد | الموقع → `/admin` → دخول → زرار **إضافة** → املي البيانات وارفع الصور (**أول صورة = الرئيسية**) → نشر |
| تعدّل أو تمسح عقار | زرار القلم ✏️ / السلة 🗑️ على الكارت نفسه |
| تخبي عقار مؤقتاً | زرار **مسودة** — يختفي من الموقع بس مايتمسحش |
| تميّز عقار يظهر الأول | زرار النجمة ⭐ |
| تشوف العملاء الجداد | `/admin/leads` — **الصفارا** ⏰ محتاجين اتصال، **الخضرا** ✅ خلصوا |
| تكتب تفاصيل مكالمة | زرار الورقة 🗒️ جنب كل عميل |
| تغيّر رقم الواتساب | Supabase → Table Editor → `settings` → عدّل `whatsapp` |
| تغيّر باسورد الأدمن | `.env.local` → `node scripts/sync-admin-password.mjs` → غيّرها برضو في Vercel → Redeploy |

## 13) 🌐 الدومين المخصص (لو عايز اسمك بدل vercel.app)

1. اشتري الدومين من Namecheap أو GoDaddy (~10$ في السنة)
2. Vercel → مشروعك → **Settings → Domains → Add** → اكتب الدومين
3. Vercel هيعرضك **DNS records** — انسخهم وحطهم في لوحة تحكم مزود الدومين
4. استنى الانتشار (من دقايق لساعات) → الموقع يشتغل على دومينك
5. **مهم:** حدّث `NEXT_PUBLIC_SITE_URL` في Vercel بالدومين الجديد → Redeploy (عشان الـ SEO وsitemap يشتغلوا صح)

## 14) 🛡️ الصيانة والطوارئ

- **نسخة احتياطية:** مفيش باكب تلقائي كويس في الخطة المجانية — كل فترة: Supabase → Table Editor → Export CSV لجدولي `units` و`leads`
- **لو نشر جديد بوّظ الموقع:** Vercel → Deployments → آخر نسخة كانت شغالة → **⋯ → Promote to Production** — الموقع يرجع في ثواني من غير ما تعمل أي حاجة تانية
- **مراقبة:** Vercel → Analytics (الزوار)، Supabase → Logs (أخطاء القاعدة)
- **التكلفة كلها:** Next.js + Supabase + Vercel = **مجانين** للبداية، الدومين ~10$/سنة
