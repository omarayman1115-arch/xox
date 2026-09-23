import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAdminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** إحصائيات العملاء للأدمن: اليوم / آخر 7 أيام / نسبة التواصل / الإجمالي */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "supabase_missing" }, { status: 503 });

  const { data, error } = await supabase
    .from("leads")
    .select("status, created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const dayMs = 86400000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = data ?? [];
  const stats = {
    today: 0,
    week: 0,
    contacted: 0,
    total: rows.length,
  };
  for (const r of rows) {
    const ts = new Date(r.created_at as string).getTime();
    if (ts >= startOfToday.getTime()) stats.today++;
    if (now - ts < 7 * dayMs) stats.week++;
    if (r.status === "contacted") stats.contacted++;
  }

  return NextResponse.json(stats);
}
