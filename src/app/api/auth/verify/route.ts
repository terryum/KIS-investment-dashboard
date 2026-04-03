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

    return NextResponse.json({ success: true, token: pinHash });
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }
}
