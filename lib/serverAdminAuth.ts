import { isAdmin } from "./auth";
import { getSupabaseAdmin, isServerAdminConfigured } from "./supabaseAdmin";

export const DEFAULT_ADMIN_EMAIL = "admin@xox-realestate.com";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAIL)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * حماية موحدة لكل نقاط API الأدمن:
 * 1) جلسة Supabase حقيقية — Bearer token يتأكد منه على السيرفر + الإيميل لازم يكون في ADMIN_EMAILS
 * 2) احتياطي: كوكي كلمة السر (للوضع التجريبي أو لو Supabase Auth مش متظبط)
 */
export async function requireAdmin(req: Request): Promise<boolean> {
  const authz = req.headers.get("authorization");
  if (authz?.startsWith("Bearer ") && isServerAdminConfigured) {
    const token = authz.slice(7).trim();
    if (token.length > 20) {
      const { data } = await getSupabaseAdmin()!.auth.getUser(token);
      const email = (data?.user?.email ?? "").toLowerCase();
      if (data?.user && adminEmails().includes(email)) return true;
    }
  }
  // احتياطي — نفس النظام القديم المبني على كوكي httpOnly
  return await isAdmin();
}
