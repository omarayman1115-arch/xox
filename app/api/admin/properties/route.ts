import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAdminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PROPERTIES_TABLE } from "@/lib/supabase";
import type { Property } from "@/lib/types";
import {
  mockList,
  mockGet,
  mockCreate,
  mockUpdate,
  mockDelete,
} from "@/lib/adminStore";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** هل الخطأ بسبب عمود مش موجود لسه (قبل تنفيذ negotiable-video.sql)؟ */
function isMissingColumn(e: { code?: string; message?: string } | null): boolean {
  if (!e) return false;
  return e.code === "PGRST204" || /column .* does not exist|Could not find the/i.test(e.message ?? "");
}

/** نسخة من السجل من غير الأعمدة الجديدة — احتياط قبل تنفيذ الـ SQL */
function stripNewFields<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const { video, negotiable, ...rest } = obj;
  return rest;
}

/* ---------- القائمة ---------- */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(PROPERTIES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }
  return NextResponse.json(mockList());
}

/* ---------- الإضافة ---------- */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const body = (await req.json()) as Partial<Property>;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const record: Property = {
    id,
    created_at: now,
    listing_type: body.listing_type === "rent" ? "rent" : "sale",
    rent_period:
      body.listing_type === "rent"
        ? body.rent_period ?? "monthly"
        : null,
    property_type: body.property_type ?? "شقة",
    title: body.title ?? "بدون عنوان",
    description: body.description ?? "",
    price: Number(body.price) || 0,
    governorate: body.governorate ?? "القاهرة",
    city: body.city ?? "",
    district: body.district ?? "",
    area: Number(body.area) || 0,
    bedrooms: Number(body.bedrooms) || 0,
    bathrooms: Number(body.bathrooms) || 0,
    features: body.features ?? [],
    images: body.images ?? [],
    video: body.video ?? null,
    negotiable: !!body.negotiable,
    contact_phone: body.contact_phone ?? "",
    is_featured: !!body.is_featured,
    is_published: body.is_published ?? true,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    let { data, error } = await supabase
      .from(PROPERTIES_TABLE)
      .insert(record)
      .select()
      .single();
    // الأعمدة الجديدة لسه مش متضافة في القاعدة؟ نعيد المحاولة من غيرهم
    if (error && isMissingColumn(error)) {
      ({ data, error } = await supabase
        .from(PROPERTIES_TABLE)
        .insert(stripNewFields(record as unknown as Record<string, unknown>))
        .select()
        .single());
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
  return NextResponse.json(mockCreate(record), { status: 201 });
}

/* ---------- التعديل ---------- */
export async function PATCH(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const body = (await req.json()) as Partial<Property> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { id, ...rest } = body;
    // قائمة بيضاء — الأعمدة المسموح تعديلها فقط (يحمي أعمدة النظام)
    const patch: Record<string, unknown> = {};
    const allowed = [
      "listing_type", "rent_period", "property_type", "title", "description",
      "price", "governorate", "city", "district", "area", "bedrooms",
      "bathrooms", "features", "images", "video", "negotiable",
      "contact_phone", "is_featured", "is_published",
    ] as const;
    for (const k of allowed) {
      if (k in rest) patch[k] = rest[k as keyof typeof rest];
    }
    let { data, error } = await supabase
      .from(PROPERTIES_TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    // نفس الاحتياط: قبل تنفيذ negotiable-video.sql ننجح من غير الأعمدة الجديدة
    if (error && isMissingColumn(error)) {
      ({ data, error } = await supabase
        .from(PROPERTIES_TABLE)
        .update(stripNewFields(patch))
        .eq("id", id)
        .select()
        .single());
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const updated = mockUpdate(body.id, body);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

/* ---------- الحذف ---------- */
export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || id === "undefined") {
    return NextResponse.json(
      { error: "missing_id", hint: "لازم تبعت ?id= مع طلب الحذف" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from(PROPERTIES_TABLE).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: mockDelete(id) });
}
