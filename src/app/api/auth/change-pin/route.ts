import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { withAuth } from "@/lib/auth/middleware";

export async function POST(request: Request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { currentPinHash, newPinHash } = body as {
      currentPinHash?: string;
      newPinHash?: string;
    };

    if (!currentPinHash || !newPinHash) {
      return NextResponse.json(
        { error: "현재 PIN과 새 PIN이 필요합니다" },
        { status: 400 },
      );
    }

    // Verify current PIN
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "pin_hash")
      .single();

    if (error || !data || currentPinHash !== data.value) {
      return NextResponse.json(
        { error: "현재 PIN이 올바르지 않습니다" },
        { status: 401 },
      );
    }

    // Update to new PIN
    const { error: updateError } = await supabaseAdmin
      .from("app_settings")
      .update({ value: newPinHash })
      .eq("key", "pin_hash");

    if (updateError) {
      return NextResponse.json(
        { error: "PIN 변경에 실패했습니다" },
        { status: 500 },
      );
    }

    // Set new cookie with updated PIN hash
    const response = NextResponse.json({ success: true });
    response.cookies.set("pin-token", newPinHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "PIN 변경에 실패했습니다" },
      { status: 500 },
    );
  }
}
