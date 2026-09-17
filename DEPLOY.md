# دليل النشر على Vercel 🚀

## المتغيرات البيئية المطلوبة (Environment Variables)

دي القيم اللي هتحطها في Vercel (Project → Settings → Environment Variables):
اختار Environments: **Production, Preview, Development** (علّم على التلاتة)

| الاسم | القيمة | ملاحظات |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mkhaxwcqngbtawgmncam.supabase.co` | من Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح `sb_publishable_...` | المفتاح المنشور بتاع المشروع |
| `SUPABASE_SECRET_KEY` | مفتاح `sb_secret_...` | ⚠️ سري — متحطوش في الكود |
| `ADMIN_PASSWORD` | كلمة السر بتاعة لوحة التحكم | غيّرها عن المحلية |
| `NEXT_PUBLIC_SITE_URL` | `https://اسم-مشروعك.vercel.app` | رابط موقعك النهائي — حطه بعد أول Deploy |
| `NEXT_PUBLIC_DEFAULT_WHATSAPP` | `201151707244` | رقم الواتساب |

---

## الطريقة 1 — بدون GitHub (Vercel CLI) ⭐ الأسرع

### 1. سطّب Vercel CLI
افتح Terminal/PowerShell في فولدر المشروع ونفّذ:

```bash
npm i -g vercel
```

### 2. اعمل Deploy
```bash
vercel
```
- أول مرة هيطلب **Login** → هيتصل بمتصفحك ويسجل دخول (اعمل حساب بالإيميل أو GitHub)
- بعدها هيسألك أسئلة الإعداد — جاوب كده:
  - **Set up and deploy "...\New folder"?** → `Y`
  - **Which scope?** → دوس Enter (حسابك)
  - **Link to existing project?** → `N`
  - **What's your project's name?** → اكتب `xox` (أو أي اسم — ده هيبقى في الرابط)
  - **In which directory is your code?** → `./` (Enter)
  - **Want to modify these settings?** → `N`

### 3. حط المتغيرات البيئية
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# الصق: https://mkhaxwcqngbtawgmncam.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# الصق: sb_publishable_...

vercel env add SUPABASE_SECRET_KEY production
# الصق: sb_secret_...

vercel env add ADMIN_PASSWORD production
# اكتب كلمة السر القوية

vercel env add NEXT_PUBLIC_DEFAULT_WHATSAPP production
# الصق: 201151707244
```
(كرر نفس الأوامر من غير كلمة production عشان تتحط في Preview كمان — أو علّم عليها من الموقع)

### 4. اعمل Deploy النهائي (Production)
```bash
vercel --prod
```

🎉 **خلصنا!** هيطبعلك رابط زي: `https://xox-xxxx.vercel.app`

### 5. بعد أول نشر — حدد رابط الموقع
```bash
vercel env add NEXT_PUBLIC_SITE_URL production
# الصق الرابط اللي طلع: https://xox-xxxx.vercel.app
vercel --prod
```
(عشان الـ sitemap وSEO يشتغلوا بالرابط الصح)

---

## الطريقة 2 — بـ GitHub (أوتماتيك لأي تحديث)

### 1. ارفع الكود على GitHub
اعمل repo جديد اسمه `xox` من github.com (من غير README)

```bash
git init
git add .
git commit -m "xox real estate site - ready to deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/xox.git
git push -u origin main
```

### 2. اربطه بـ Vercel
1. ادخل [vercel.com/new](https://vercel.com/new)
2. دوس **Import Git Repository** → اختار repo اللي رفعته
3. **قبل ما تدوس Deploy:** افتح **Environment Variables** وحط الجدول اللي فوق
4. دوس **Deploy** واستنى دقيقة

### 3. بعد النشر
- أي `git push` جديد هيحدّث الموقع **أوتوماتيك** 🔄
- تقدر تغير المتغيرات من: Project → Settings → Environment Variables (وبعدها اعمل redeploy)

---

## بعد النشر — خطوات مهمة

### 1. جرب الموقع
- افتح الرابط — لازم يعرض عقاراتك من Supabase
- `/admin` — سجل دخول وجرّب تضيف عقار
- افتح الموقع من **موبايلك** وشوف الشكل

### 2. اربط Google Search Console (مهم للسيو)
1. ادخل [search.google.com/search-console](https://search.google.com/search-console)
2. **Add property** → حط رابط موقعك
3. ارفع ملف التحقق أو استخدم DNS
4. بعد التحقق: **Sitemaps** → حط `sitemap.xml` → Submit
5. **URL Inspection** → حط رابط الرئيسية → **Request Indexing**

جوجل يبدأ يفهرس موقعك خلال أيام — وكل عقار جديد هيتفهرس لوحده (عندك sitemap ديناميكي + JSON-LD جاهزين).

### 3. غيّر رابط Supabase المسموح (اختياري بس آمن)
Supabase → Authentication → URL Configuration → **Site URL**: حط رابط موقعك (ده بيمنع استخدامه من مواقع تانية)

### 4. دومين خاص (اختياري)
لو عندك دومين (مثلاً `xox.com`): Project → Settings → Domains → Add → واتبعت التعليمات في company اللي اشتريت منها الدومين.

---

## مشاكل شائعة وحلولها

| المشكلة | الحل |
|---|---|
| الموقع فاضي بعد النشر | اتأكد إن `NEXT_PUBLIC_SUPABASE_URL` و`ANON_KEY` متحطين في Vercel — وبعدها اعمل **Redeploy** |
| اللوحة بتقول unauthorized | `ADMIN_PASSWORD` ناقصة أو مختلفة — اتأكد منها في Vercel |
| رفع الصور بيفشل | `SUPABASE_SECRET_KEY` ناقصة في Vercel |
| الصور مش بتظهر | اتأكد إن bucket اسمه `property-images` وPublic (نفّذ `supabase/schema.sql` تاني لو مش متأكد) |
| عايز تحدّث الموقع | لو CLI: `vercel --prod` — لو GitHub: أي push جديد |
