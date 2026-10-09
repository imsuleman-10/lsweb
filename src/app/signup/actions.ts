"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function signup(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();

  // Validation
  if (!email || !password || !fullName) {
    return { error: "All fields are required" };
  }
  if (fullName.length < 2) {
    return { error: "Please enter your full name" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();

  // Check if email already exists
  const admin = getAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending") {
      return { error: "An account with this email is already pending approval. Please wait or contact admin." };
    }
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  // Sign up the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "This email is already registered. Please sign in instead." };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed. Please try again." };
  }

  // Create profile entry immediately using admin client
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email: data.user.email,
    full_name: fullName,
    role: "member",
    position: "none",
    status: "pending",
  }, { onConflict: "id" });

  if (profileError) {
    console.error("Profile creation failed:", profileError);
  }

  if (data.user.email_confirmed_at) {
    return { success: true, redirectUrl: "/?message=Account created! Awaiting admin approval." };
  }

  return { success: true, verify: true, email };
}

export async function verifyOtpAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const otp = (formData.get("otp") as string)?.trim();

  if (!otp || otp.length !== 6) {
    return { error: "Please enter all 6 digits of the verification code", email };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { error: "OTP must contain only numbers", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "signup",
  });

  if (error) {
    let msg = "Invalid or expired code. Please request a new one.";
    if (error.message.toLowerCase().includes("expired")) {
      msg = "Your verification code has expired. Please sign up again to get a new code.";
    } else if (error.message.toLowerCase().includes("invalid")) {
      msg = "Incorrect code. Please double-check and try again.";
    }
    return { error: msg, email };
  }

  return { success: true, redirectUrl: "/?message=Email verified! Your account is pending admin approval." };
}
