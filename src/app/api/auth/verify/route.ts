import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function parseDevice(ua: string): string {
  if (/iPhone/i.test(ua)) return "Safari on iPhone";
  if (/iPad/i.test(ua)) return "Safari on iPad";
  if (/Android/i.test(ua)) return "Chrome on Android";
  if (/Mac OS/i.test(ua)) {
    if (/Chrome/i.test(ua)) return "Chrome on macOS";
    if (/Safari/i.test(ua)) return "Safari on macOS";
    if (/Firefox/i.test(ua)) return "Firefox on macOS";
    return "Browser on macOS";
  }
  if (/Windows/i.test(ua)) {
    if (/Chrome/i.test(ua)) return "Chrome on Windows";
    if (/Firefox/i.test(ua)) return "Firefox on Windows";
    if (/Edge/i.test(ua)) return "Edge on Windows";
    return "Browser on Windows";
  }
  if (/Linux/i.test(ua)) return "Browser on Linux";
  return "Unknown device";
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "";
  const deviceSummary = parseDevice(userAgent);

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
      // Record failed attempt
      await supabaseAdmin.from("login_history").insert({
        ip_address: ip,
        user_agent: userAgent,
        device_summary: deviceSummary,
        success: false,
      });
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 },
      );
    }

    // Get last successful login BEFORE recording the current one
    const { data: lastLogin } = await supabaseAdmin
      .from("login_history")
      .select("ip_address, device_summary, created_at")
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Record current successful login
    await supabaseAdmin.from("login_history").insert({
      ip_address: ip,
      user_agent: userAgent,
      device_summary: deviceSummary,
      success: true,
    });

    // Set httpOnly cookie for route protection
    const response = NextResponse.json({
      success: true,
      lastLogin: lastLogin
        ? {
            ip: lastLogin.ip_address,
            device: lastLogin.device_summary,
            at: lastLogin.created_at,
          }
        : null,
    });
    response.cookies.set("pin-token", pinHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }
}
