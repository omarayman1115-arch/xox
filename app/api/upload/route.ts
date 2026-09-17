import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin, isServerAdminConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isServerAdminConfigured) {
    return NextResponse.json(
      {
        error:
          "الوضع التجريبي: اربط Supabase الأول (.env.local) عشان رفع الصور يشتغل",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    // حد أقصى 5 ميجا
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    // صور بس
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "not_an_image" }, { status: 415 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "supabase_missing" }, { status: 503 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(name, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // لو البوليسي رفض الرفع، جرّب ونفحص — المهم نرجّع رسالة واضحة
    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(name);

    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload_failed" },
      { status: 500 }
    );
  }
}
