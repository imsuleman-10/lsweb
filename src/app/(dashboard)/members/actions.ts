"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/lib/email";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Get caller's profile ─────────────────────────────────────────────────────
async function getCallerProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { user, role: profile?.role ?? "member" };
}

// ── Approve / Suspend a member (Super Admin + Core Body) ────────────────────
export async function updateMemberStatus(userId: string, newStatus: string) {
  const { user, role: callerRole } = await getCallerProfile();
  const isSuperAdmin = callerRole === "super_admin";
  const isCoreBody   = callerRole === "corebody";
  if (!isSuperAdmin && !isCoreBody) throw new Error("Forbidden: You don't have permission to modify member status.");

  const admin = getAdmin();
  if (isCoreBody) {
    const { data: target } = await admin.from("profiles").select("role").eq("id", userId).single();
    if (target && ["super_admin", "corebody"].includes(target.role)) {
      throw new Error("Core Body cannot modify status of Super Admin or Core Body members.");
    }
  }

  const { error } = await admin.from("profiles").update({ status: newStatus }).eq("id", userId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `Updated member status to "${newStatus}"`,
    entity: "profiles",
    entity_id: userId
  });

  revalidatePath("/members");
}

// ── Change a member's role / position ────────────────────────────────────────
export async function updateMemberRole(userId: string, role: string, position: string) {
  const { user, role: callerRole } = await getCallerProfile();

  const isSuperAdmin = callerRole === "super_admin";
  const isCoreBody = callerRole === "corebody";
  if (!isSuperAdmin && !isCoreBody) throw new Error("Forbidden");

  // Core Body cannot promote to super_admin / corebody
  if (isCoreBody && ["super_admin", "corebody"].includes(role)) {
    throw new Error("Core Body can only assign Director, Head, or Member roles.");
  }

  const admin = getAdmin();
  const { error } = await admin.from("profiles").update({ role, position }).eq("id", userId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `Changed role of user ${userId} to ${role} (${position})`,
    entity: "profiles",
    entity_id: userId
  });

  revalidatePath("/members");
}

// ── Create a new member account with credentials ─────────────────────────────
export async function createMember(formData: FormData) {
  const email    = formData.get("email")     as string;
  const password = formData.get("password")  as string;
  const full_name = formData.get("full_name") as string;
  const role     = formData.get("role")      as string;
  const position = formData.get("position")  as string;

  if (!email || !password || !full_name || !role) throw new Error("All fields are required");

  const { user, role: callerRole } = await getCallerProfile();
  const isSuperAdmin = callerRole === "super_admin";
  const isCoreBody   = callerRole === "corebody";
  if (!isSuperAdmin && !isCoreBody) throw new Error("Forbidden");

  // Core Body cannot create super_admin / corebody accounts
  if (isCoreBody && ["super_admin", "corebody"].includes(role)) {
    throw new Error("Core Body can only create Director, Head, or Member accounts.");
  }

  const admin = getAdmin();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Failed to create auth user");

  // Upsert profile (handles trigger-created row)
  const { error: profileError } = await admin.from("profiles").upsert({
    id:       authData.user.id,
    email,
    full_name,
    role,
    position: position || "none",
    status:   "active",
  });
  if (profileError) throw new Error(profileError.message);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action:   `Created account for ${email} as ${role} (${position || "none"})`,
    entity:   "profiles",
    entity_id: authData.user.id,
  });

  // Send welcome email with credentials
  try {
    await sendWelcomeEmail(email, full_name, role, password);
  } catch (e) {
    console.error("Welcome email failed:", e);
  }

  revalidatePath("/members");
}

// ── Reset a member's password (Super Admin only) ──────────────────────────────
export async function resetMemberPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters");

  const { user, role } = await getCallerProfile();
  if (role !== "super_admin") throw new Error("Only Super Admin can reset passwords.");

  const admin = getAdmin();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id:  user.id,
    action:    `Reset password for user ${userId}`,
    entity:    "profiles",
    entity_id: userId,
  });

  revalidatePath("/members");
}

// ── Delete a member account (Super Admin + CoreBody) ─────────────────────────
export async function deleteMember(userId: string) {
  const { user, role: callerRole } = await getCallerProfile();

  const isSuperAdmin = callerRole === "super_admin";
  const isCoreBody   = callerRole === "corebody";
  if (!isSuperAdmin && !isCoreBody) throw new Error("Forbidden: You don't have permission to delete members.");

  // Fetch the target profile to enforce CoreBody restriction
  const admin = getAdmin();
  const { data: target } = await admin.from("profiles").select("role, email").eq("id", userId).single();
  if (!target) throw new Error("Member not found.");

  // CoreBody cannot delete super_admin or other corebody accounts
  if (isCoreBody && ["super_admin", "corebody"].includes(target.role)) {
    throw new Error("Core Body cannot delete Super Admin or other Core Body accounts.");
  }

  // Cannot delete yourself
  if (userId === user.id) throw new Error("You cannot delete your own account.");

  // Delete from auth (cascade deletes profile via trigger if set up, otherwise delete profile first)
  const { error: profileErr } = await admin.from("profiles").delete().eq("id", userId);
  if (profileErr) throw new Error(profileErr.message);

  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) throw new Error(authErr.message);

  await admin.from("audit_logs").insert({
    actor_id:  user.id,
    action:    `Deleted member account: ${target.email}`,
    entity:    "profiles",
    entity_id: userId,
  });

  revalidatePath("/members");
}
