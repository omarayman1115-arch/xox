import { NextResponse } from "next/server";
import { checkPassword, ADMIN_COOKIE, adminToken } from "@/lib/auth";
import { getSupabaseAdmin, isServerAdminConfigured } from "@/lib/supabaseAdmin";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/serverAdminAuth";

/**
 * تسجيل دخول الأدمن:
 * 1) يتأكد من كلمة السر (ADMIN_PASSWORD على السيرفر)
 * 2) يفتح جلسة Supabase Auth حقيقية وي anteها للمتصفح
 *    (عشان RLS والـ Bearer token في كل نداءات الأدمن)
 * 3) يسيب الكوكي القديم شغال كاحتياطي
 */
export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const pwd = String(password ?? "");
    if (!checkPassword(pwd)) {
      return NextResponse.json({ error: "wrong_password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
    });

    // جلسة Supabase حقيقية — بس لو المستخدم اتعمل فعلاً في Auth
    if (isServerAdminConfigured) {
      try {
        const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();
        const { data, error } = await getSupabaseAdmin()!.auth.signInWithPassword({
          email,
          password: pwd,
        });
        if (!error && data.session) {
          return NextResponse.json({
            ok: true,
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            },
          });
        }
      } catch {
        /* تجاهل — الكوكي هيفضل شغال */
      }
    }

    return res;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
