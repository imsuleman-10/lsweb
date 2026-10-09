import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getLatestOTPRecord, deleteOTPRecord } from "@/lib/otp-store";

// ── Decryption helper ─────────────────────────────────────────────────────────
function getEncKey() {
  return crypto.createHash("sha256").update(process.env.SUPABASE_SERVICE_ROLE_KEY!).digest();
}
function decryptPassword(encText: string): string {
  const [ivHex, encHex] = encText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getEncKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp || otp.toString().trim().length !== 6) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    const enteredOtp = otp.toString().trim();

    // ── Look up OTP record ────────────────────────────────────────────────────
    const record = await getLatestOTPRecord(normEmail);

    if (!record) {
      return NextResponse.json(
        { error: "No verification code found. Please sign up again." },
        { status: 400 }
      );
    }

    // ── Check expiry ──────────────────────────────────────────────────────────
    if (new Date(record.expires_at) < new Date()) {
      await deleteOTPRecord(normEmail, record.id);
      return NextResponse.json(
        { error: "Your code has expired. Please sign up again to get a new code." },
        { status: 400 }
      );
    }

    // ── Check OTP match ───────────────────────────────────────────────────────
    if (record.otp.trim() !== enteredOtp) {
      return NextResponse.json(
        { error: "Invalid code. Please check and try again." },
        { status: 400 }
      );
    }

    // ── Decrypt password ──────────────────────────────────────────────────────
    const password = decryptPassword(record.password_enc);

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Create Supabase auth user (email pre-confirmed) ───────────────────────
    let userId: string | undefined;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: record.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: record.full_name },
    });

    if (authData?.user?.id) {
      userId = authData.user.id;
    } else if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        // User already exists in Auth, retrieve their ID and update them
        const { data: listData } = await admin.auth.admin.listUsers();
        const existingAuth = listData?.users?.find(
          (u) => u.email?.toLowerCase() === record.email.toLowerCase()
        );
        if (existingAuth) {
          userId = existingAuth.id;
          await admin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: { full_name: record.full_name },
          });
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    if (userId) {
      // ── Create profile (status: pending — awaiting admin approval) ────────────
      const { error: profileErr } = await admin.from("profiles").upsert(
        {
          id: userId,
          email: record.email,
          full_name: record.full_name,
          role: "member",
          position: "none",
          status: "pending",
        },
        { onConflict: "id" }
      );

      if (profileErr) {
        console.error("[Verify OTP] Profile creation error:", profileErr);
        return NextResponse.json(
          { error: "Account created but profile setup failed. Contact admin." },
          { status: 500 }
        );
      }
    }

    // ── Clean up OTP record ─────────────────────────────────────────
    await deleteOTPRecord(record.email, record.id);

    // Return success — client will sign in with signInWithPassword()
    return NextResponse.json({ success: true, email: record.email, password });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
