"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requirePrivilege() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Please log in.");

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, position")
    .eq("id", user.id)
    .single();

  const role = (profile?.role || "").trim().toLowerCase();
  const position = (profile?.position || "").trim().toLowerCase();

  const isPrivileged =
    ["super_admin", "corebody", "core_body", "managing_director"].includes(role) ||
    ["vp", "gs", "president", "treasurer", "managing_director"].includes(position);

  if (!isPrivileged) {
    throw new Error("Forbidden: Only Core Body or Admin can manage Phylums.");
  }
  return { userId: user.id, role };
}

// ── Create Phylum or Wing ────────────────────────────────────────
export async function createPhylum(formData: FormData) {
  const { userId } = await requirePrivilege();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const type = (formData.get("type") as string) || "phylum";

  if (!name) throw new Error("Name is required");

  const admin = getAdmin();
  const { data, error } = await admin.from("phylums").insert({
    name,
    description,
    type,
    created_by: userId,
    status: "active",
  }).select().single();

  if (error) {
    console.error("[createPhylum error]:", error);
    throw new Error(error.message);
  }

  try {
    await admin.from("audit_logs").insert({
      actor_id: userId,
      action: `Created new ${type}: ${name}`,
      entity: "phylums",
      entity_id: data.id,
    });
  } catch (auditErr) {
    console.warn("Audit log insert skipped:", auditErr);
  }

  revalidatePath("/phylums");
}

// ── Assign Director or Head to a Phylum ─────────────────────────
export async function assignPhylumLeader(formData: FormData) {
  const { userId } = await requirePrivilege();
  const phylumId   = formData.get("phylum_id")    as string;
  const targetRole = formData.get("target_role")  as string; // "director" or "head"
  const mode       = formData.get("mode")          as string; // "existing" or "new"

  if (!phylumId || !targetRole) throw new Error("Missing required fields");

  const admin = getAdmin();

  let memberId: string;

  if (mode === "existing") {
    memberId = formData.get("member_id") as string;
    if (!memberId) throw new Error("Please select a member");
  } else {
    // Create new account
    const email    = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const fullName = (formData.get("full_name") as string)?.trim();

    if (!email || !password || !fullName) throw new Error("All fields required to create new account");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) throw new Error(authError.message);
    memberId = authData.user!.id;

    await admin.from("profiles").upsert({
      id: memberId, email, full_name: fullName,
      role: targetRole, position: targetRole, status: "active"
    });

    // Send welcome email
    try { await sendWelcomeEmail(email, fullName, targetRole, password); } catch {}
  }

  // Update the profile role
  await admin.from("profiles").update({
    role: targetRole, position: targetRole, phylum_id: phylumId
  }).eq("id", memberId);

  // Assign to phylum column
  const column = targetRole === "director" ? "director_id" : "head_id";
  const { error: phylumErr } = await admin.from("phylums").update({ [column]: memberId }).eq("id", phylumId);
  if (phylumErr) throw new Error(phylumErr.message);

  try {
    const { data: phylumData } = await admin.from("phylums").select("name").eq("id", phylumId).single();
    const phylumName = phylumData?.name || "department";
    notifyUser(memberId, {
      title: "🎯 New Leadership Role",
      message: `You have been appointed as ${targetRole === "director" ? "Director" : "Head"} of ${phylumName}.`,
      url: "/phylums"
    }).catch(err => console.error("Phylum leader notification failed:", err));
  } catch {}

  revalidatePath("/phylums");
}

// ── Delete Phylum ────────────────────────────────────────────────
export async function deletePhylum(phylumId: string) {
  const { userId } = await requirePrivilege();
  const admin = getAdmin();
  const { error } = await admin.from("phylums").delete().eq("id", phylumId);
  if (error) throw new Error(error.message);
  await admin.from("audit_logs").insert({
    actor_id: userId, action: `Deleted phylum ${phylumId}`, entity: "phylums", entity_id: phylumId
  });
  revalidatePath("/phylums");
}
