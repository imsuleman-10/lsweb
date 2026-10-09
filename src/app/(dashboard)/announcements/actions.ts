"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notifyAllActiveMembers } from "@/lib/notifications";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function createAnnouncement(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  if (!title || !content) throw new Error("Title and content are required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, position").eq("id", user.id).single();
  const role = (profile?.role || "").trim().toLowerCase();
  const position = (profile?.position || "").trim().toLowerCase();

  const canPost =
    ["super_admin", "corebody", "core_body", "managing_director"].includes(role) ||
    ["vp", "gs", "president", "treasurer", "managing_director"].includes(position);

  if (!canPost) {
    throw new Error("Only Core Body or Managing Directors can post announcements.");
  }

  const { error } = await admin.from("announcements").insert({
    title, content, published_by: user.id
  });
  if (error) throw new Error(error.message);

  try {
    await admin.from("audit_logs").insert({
      actor_id: user.id, action: `Posted announcement: "${title}"`, entity: "announcements"
    });
  } catch {}

  revalidatePath("/announcements");

  // Broadcast in-app notification to all members + Web Push instantly
  notifyAllActiveMembers({
    title: `📢 New Announcement: ${title}`,
    message: `${title} — ${content.length > 90 ? content.slice(0, 90) + "..." : content}`,
    url: "/announcements",
  }).catch((err) => console.error("Announcement notification broadcast failed:", err));
}

export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, position").eq("id", user.id).single();
  const role = (profile?.role || "").trim().toLowerCase();
  const position = (profile?.position || "").trim().toLowerCase();

  const canDelete =
    ["super_admin", "corebody", "core_body", "managing_director"].includes(role) ||
    ["vp", "gs", "president", "treasurer", "managing_director"].includes(position);

  if (!canDelete) {
    throw new Error("Forbidden: Only Core Body or Admin can delete announcements.");
  }

  const { error } = await admin.from("announcements").delete().eq("id", announcementId);
  if (error) throw new Error(error.message);

  try {
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: `Deleted announcement ${announcementId}`,
      entity: "announcements"
    });
  } catch {}

  revalidatePath("/announcements");
}
