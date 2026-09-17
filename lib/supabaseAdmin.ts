import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل Supabase بالمفتاح السري — للسيرفر فقط (API routes المحمية بكلمة سر الأدمن).
 * بيتجاوز RLS لأن عمليات الكتابة محمية أصلاً بتسجيل دخول الأدمن في الكوكي.
 * ممنوع منعاً باتاً استخدامه في أي ملف بيتروح للمتصفح.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const isServerAdminConfigured = !!url && !!secretKey;

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isServerAdminConfigured) return null;
  if (!adminClient) {
    adminClient = createClient(url as string, secretKey as string, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}
