import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendOTPEmail } from "@/lib/email";

// ── Encryption helpers (password stored temporarily, max 10 min) ───────────
function getEncKey() {
  return crypto.createHash("sha256").update(process.env.SUPABASE_SERVICE_ROLE_KEY!).digest();
}
function encryptPassword(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Block if a verified profile already exists
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // Delete any old pending OTP for this email (allow retry)
    await admin.from("otp_verifications").delete().eq("email", email.toLowerCase());

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const passwordEnc = encryptPassword(password);

    // Store OTP record (profile NOT created yet — only after OTP verify)
    const { error: otpErr } = await admin.from("otp_verifications").insert({
      email: email.toLowerCase(),
      full_name,
      otp,
      password_enc: passwordEnc,
      expires_at: expiresAt,
    });

    if (otpErr) {
      return NextResponse.json({ error: "Failed to initiate verification. Try again." }, { status: 500 });
    }

    // Send OTP via Nodemailer (our own styled email — NO Supabase email)
    await sendOTPEmail(email, otp, full_name);

    return NextResponse.json({ success: true, verify: true, email: email.toLowerCase() });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

