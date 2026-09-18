// إنشاء مستخدم الأدمن في Supabase Auth
// التشغيل: node scripts/create-admin.mjs [email] [password]
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
  console.error("✗ ناقص NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SECRET_KEY في .env.local");
  process.exit(1);
}

const email = (process.argv[2] || "admin@xox-realestate.com").toLowerCase();
const password = process.argv[3] || "Xox@Omar2026!";

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (/already|registered|exist/i.test(error.message)) {
    console.log(`✓ المستخدم موجود بالفعل: ${email}`);
  } else {
    console.error("✗ فشل الإنشاء:", error.message);
    process.exit(1);
  }
} else {
  console.log(`✓ اتعمل مستخدم الأدمن: ${data.user.email} (id: ${data.user.id})`);
}

// تأكيد إن تسجيل الدخول شغال
const { error: loginErr } = await sb.auth.signInWithPassword({ email, password: password ?? "" });
if (loginErr && !/invalid/i.test(loginErr.message)) {
  console.log(`ℹ ملاحظة فحص الدخول: ${loginErr.message}`);
} else if (!loginErr) {
  console.log("✓ تسجيل الدخول بالبيانات دي شغال");
}

console.log(`EMAIL: ${email}`);
