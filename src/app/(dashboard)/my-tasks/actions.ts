"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

import { notifyUser } from "@/lib/notifications";

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select("title, assigned_to, assigned_by")
    .eq("id", taskId)
    .single();

  if (task?.assigned_to !== user.id) throw new Error("Forbidden: You can only update your own tasks.");

  const { error } = await admin.from("tasks").update({ status: newStatus }).eq("id", taskId);
  if (error) throw new Error(error.message);

  const { data: updaterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const updaterName = updaterProfile?.full_name || "A member";

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `Updated task status to ${newStatus}`,
    entity: "tasks",
    entity_id: taskId
  });

  // Notify the person who assigned the task
  if (task?.assigned_by && task.assigned_by !== user.id) {
    notifyUser(task.assigned_by, {
      title: `Task Updated: ${task.title}`,
      message: `${updaterName} changed status of "${task.title}" to ${newStatus.replace("_", " ").toUpperCase()}.`,
      url: "/tasks"
    }).catch(err => console.error("Task update notification failed:", err));
  }

  revalidatePath("/my-tasks");
  revalidatePath("/tasks");
}
