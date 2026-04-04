import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pinHash } = body as { pinHash?: string };

    if (!pinHash) {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "pin_hash")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "PIN not configured" },
        { status: 500 },
      );
    }

    if (pinHash !== data.value) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 },
      );
    }

    // Set httpOnly cookie for route protection (proxy.ts)
    const response = NextResponse.json({ success: true });
    response.cookies.set("pin-token", pinHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }
}
