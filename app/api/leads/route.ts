import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/** إدخال ليد جديد — عام (أي زائر)، بدون تسجيل دخول */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      property_id?: string;
      customer_name?: string;
      phone_number?: string;
    };

    const customer_name = (body.customer_name ?? "").trim();
    const phone_digits = (body.phone_number ?? "").replace(/[^\d]/g, "");

    if (customer_name.length < 2 || customer_name.length > 80) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    if (phone_digits.length < 8 || phone_digits.length > 20) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }

    // الكتابة من السيرفر بمفتاح الخدمة (بيتخطى RLS بشكل آمن) —
    // الإدخال بمفتاح الزائر كان بيفشل لأن supabase-js يطلب الصف الراجع
    // (return=representation) والـ anon ملوش صلاحية select على الليدز.
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "الوضع التجريبي: اربط Supabase الأول عشان تسجيل العملاء يشتغل" },
        { status: 503 }
      );
    }

    const payload = {
      property_id: body.property_id || null,
      customer_name,
      phone_number: phone_digits,
      status: "not_contacted",
    };

    let { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    // العقار ممكن يكون اتمسح — سجل الليد برضو من غير ربط بعقار
    if (error && error.code === "23503") {
      const retry = await supabase
        .from("leads")
        .insert({ ...payload, property_id: null })
        .select("id")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (error.code === "42P01" || /does not exist|relation/i.test(error.message)) {
        return NextResponse.json(
          { error: "leads_table_missing", hint: "نفّذ supabase/leads-migration.sql" },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
