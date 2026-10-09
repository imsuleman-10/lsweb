"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function sendForgotPasswordEmail(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const admin = getAdmin();

  // Check the user actually exists in our system
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, status")
    .eq("email", email)
    .single();

  if (!profile) throw new Error("No account found with this email address.");
  if (profile.status === "suspended") throw new Error("This account has been suspended. Contact an admin.");

  // Generate a Supabase password reset link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${appUrl}/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error("Failed to generate reset link. Please try again.");
  }

  await sendPasswordResetEmail(email, data.properties.action_link, profile.full_name);
}
