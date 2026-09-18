// مزامنة كلمة سر مستخدم الأدمن في Supabase Auth مع ADMIN_PASSWORD من .env.local
// التشغيل: node scripts/sync-admin-password.mjs
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
const password = env.ADMIN_PASSWORD;
const email = (env.ADMIN_EMAIL ?? "admin@xox-realestate.com").toLowerCase();

if (!url || !serviceKey || !password) {
  console.error("✗ ناقص NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SECRET_KEY أو ADMIN_PASSWORD في .env.local");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// دوّر على المستخدم بالإيميل
const { data: list, error: listErr } = await sb.auth.admin.listUsers();
if (listErr) {
  console.error("✗ فشل جلب المستخدمين:", listErr.message);
  process.exit(1);
}
const user = list.users.find((u) => (u.email ?? "").toLowerCase() === email);

if (!user) {
  // مش موجود — نعمله بكلمة السر الحالية
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("✗ فشل إنشاء المستخدم:", error.message);
    process.exit(1);
  }
  console.log(`✓ اتعمل مستخدم الأدمن: ${email} بكلمة السر المحلية`);
} else {
  const { error } = await sb.auth.admin.updateUserById(user.id, { password });
  if (error) {
    console.error("✗ فشل تحديث كلمة السر:", error.message);
    process.exit(1);
  }
  console.log(`✓ اتزامنت كلمة سر ${email} مع ADMIN_PASSWORD المحلي`);
}

// تحقق نهائي
const { error: loginErr } = await sb.auth.signInWithPassword({ email, password });
console.log(loginErr ? `✗ فحص الدخول فشل: ${loginErr.message}` : "✓ تسجيل الدخول بالبيانات المحلية شغال");
