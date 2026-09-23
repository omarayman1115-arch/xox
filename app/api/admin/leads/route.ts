import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAdminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** كل الليدز — للأدمن فقط، من الأحدث للأقدم
 *  العمود note اختياري: لو لسه متضفش في قاعدة البيانات (supabase/leads-note.sql) نرجّعه فاضي بدل ما نضرب */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "supabase_missing", hint: "اربط SUPABASE_SECRET_KEY في .env.local" },
      { status: 503 }
    );
  }

  let rows: Record<string, unknown>[] | null = null;
  let selectError: { message: string } | null = null;

  // الأول نجرب مع note وfollow_up — لو العمود مش موجود نجرب من غيره
  {
    const { data, error } = await supabase
      .from("leads")
      .select("id, property_id, customer_name, phone_number, status, note, follow_up, created_at")
      .order("created_at", { ascending: false });
    rows = data;
    selectError = error;
  }
  if (selectError && /note|follow_up/i.test(selectError.message)) {
    const { data, error } = await supabase
      .from("leads")
      .select("id, property_id, customer_name, phone_number, status, note, created_at")
      .order("created_at", { ascending: false });
    rows = data;
    selectError = error;
  }
  if (selectError && /note/i.test(selectError.message)) {
    const { data, error } = await supabase
      .from("leads")
      .select("id, property_id, customer_name, phone_number, status, created_at")
      .order("created_at", { ascending: false });
    rows = data;
    selectError = error;
  }

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });
  const safe = (rows ?? []).map((r) => ({ ...r, note: r.note ?? "", follow_up: r.follow_up ?? null }));
  return NextResponse.json(safe);
}

/** تحديث الليد: الحالة (contacted / not_contacted) أو الملاحظة (note) أو الاتنين */
export async function PATCH(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const body = (await req.json()) as { id?: string; status?: string; note?: string; follow_up?: string | null };
  if (!body.id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const validStatus = body.status === "contacted" || body.status === "not_contacted";
  const note = typeof body.note === "string" ? body.note.slice(0, 2000) : undefined;
  // موعد المتابعة — تاريخ YYYY-MM-DD أو null للمسح
  const followUp =
    body.follow_up === null
      ? null
      : typeof body.follow_up === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.follow_up)
        ? body.follow_up
        : undefined;
  if (!validStatus && note === undefined && followUp === undefined) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_missing" }, { status: 503 });
  }

  const patch: { status?: string; note?: string; follow_up?: string | null } = {};
  if (validStatus) patch.status = body.status;
  if (note !== undefined) patch.note = note;
  if (followUp !== undefined) patch.follow_up = followUp;

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();

  // العمود note لسه مش متضف في قاعدة البيانات — نفّذ supabase/leads-note.sql
  if (error && /note/i.test(error.message)) {
    return NextResponse.json(
      { error: "note_column_missing", hint: "نفّذ supabase/leads-note.sql في SQL Editor" },
      { status: 503 }
    );
  }
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
