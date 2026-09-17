import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "xox_admin";

/** توكن الأدمن: هاش لكلمة السر (مش نخزن كلمة السر نفسها في الكوكي) */
export function adminToken(): string {
  const pwd = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`xox::${pwd}`).digest("hex");
}

export function checkPassword(pwd: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "change-me-to-a-strong-password";
  return pwd.length > 0 && pwd === expected;
}

/** هل الزيارة الحالية أدمن؟ (تُستخدم في API routes على السيرفر) */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const v = jar.get(ADMIN_COOKIE)?.value;
  return !!v && v === adminToken();
}
