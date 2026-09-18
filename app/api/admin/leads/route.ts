import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAdminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** كل الليدز — للأدمن فقط، من الأحدث للأقدم */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "supabase_missing", hint: "اربط SUPABASE_SECRET_KEY في .env.local" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .select("id, property_id, customer_name, phone_number, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** تغيير حالة الليد: contacted / not_contacted */
export async function PATCH(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const body = (await req.json()) as { id?: string; status?: string };
  if (!body.id || (body.status !== "contacted" && body.status !== "not_contacted")) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_missing" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ status: body.status })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** حذف ليد — للأدمن */
export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const id = new URL(req.url).searchParams.get("id");
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "supabase_missing" }, { status: 503 });

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
