"use client";

import { getSupabase } from "./supabase";

/**
 * fetch لكل نداءات API الأدمن من المتصفح.
 * بيضيف Authorization: Bearer <توكن جلسة Supabase> لو فيه جلسة،
 * وبيسيب الكوكي يشتغل (credentials: include) للوضع الرجعي.
 */
/** تخزين جلسة Supabase اللي رجعت من /api/admin/login — عشان الـ Bearer يشتغل */
export async function applyAdminSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
} | null): Promise<void> {
  const sb = getSupabase();
  if (!sb || !session?.access_token) return;
  await sb.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

export async function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    /* لو فشل تجيب الجلسة — الكوكي هيعدي لو موجود */
  }
  return fetch(url, { ...init, headers, credentials: "include" });
}
