import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: "Please enter all 6 digits of the verification code" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      let msg = "Invalid or expired code. Please request a new one.";
      if (error.message.toLowerCase().includes("expired")) {
        msg = "Your verification code has expired. Please sign up again.";
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      redirectUrl: "/?message=Email verified! Your account is pending admin approval.",
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
