import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { getLatestOTPRecord, updateOTPRecord } from "@/lib/otp-store";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

    const normEmail = email.toLowerCase().trim();

    // Check if a pending OTP record exists
    const record = await getLatestOTPRecord(normEmail);

    if (!record) {
      return NextResponse.json(
        { error: "No pending signup found for this email. Please start signup again." },
        { status: 400 }
      );
    }

    const newOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await updateOTPRecord(normEmail, newOtp, expiresAt);

    try {
      await sendOTPEmail(normEmail, newOtp, record.full_name);
    } catch (emailErr: any) {
      console.error("[Resend OTP] Failed to send email:", emailErr);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to resend code." }, { status: 500 });
  }
}
