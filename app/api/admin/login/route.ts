import { NextResponse } from "next/server";
import { checkPassword, ADMIN_COOKIE, adminToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!checkPassword(String(password ?? ""))) {
      return NextResponse.json({ error: "wrong_password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
    });
    return res;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
