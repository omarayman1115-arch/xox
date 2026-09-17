import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin, isServerAdminConfigured } from "@/lib/supabaseAdmin";
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

/* ---------- القائمة ---------- */
export async function GET() {
  if (!(await isAdmin())) return unauthorized();

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
  if (!(await isAdmin())) return unauthorized();

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
    contact_phone: body.contact_phone ?? "",
    is_featured: !!body.is_featured,
    is_published: body.is_published ?? true,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(PROPERTIES_TABLE)
      .insert(record)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
  return NextResponse.json(mockCreate(record), { status: 201 });
}

/* ---------- التعديل ---------- */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const body = (await req.json()) as Partial<Property> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { id, ...patch } = body;
    const { data, error } = await supabase
      .from(PROPERTIES_TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const updated = mockUpdate(body.id, body);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

/* ---------- الحذف ---------- */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();

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
