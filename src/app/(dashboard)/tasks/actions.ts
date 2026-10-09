"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assigned_to = formData.get("assigned_to") as string;
  const deadlineStr = formData.get("deadline") as string;

  if (!title || !assigned_to || !deadlineStr) throw new Error("Missing required fields");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: assigner } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { data: assignee } = await supabase.from("profiles").select("role").eq("id", assigned_to).single();

  const assignerRole = assigner?.role;
  const assigneeRole = assignee?.role;

  if (!assigneeRole || !assignerRole) throw new Error("Invalid profiles");

  if (["super_admin", "corebody", "managing_director"].includes(assignerRole)) {
    if (!["managing_director", "director", "head", "hr", "mentor", "member", "super_admin", "corebody"].includes(assigneeRole)) {
      throw new Error("Invalid assignment target.");
    }
  } else if (["director", "head", "mentor"].includes(assignerRole)) {
    if (assigneeRole !== "member") throw new Error("Directors, Heads, and Mentors can only assign tasks to general Members.");
  } else if (assignerRole === "hr") {
    if (!["director", "head", "member"].includes(assigneeRole)) throw new Error("HR can only assign to Directors, Heads, and Members.");
  } else {
    throw new Error("You do not have permission to assign tasks.");
  }

  const admin = getAdminClient();
  const { error } = await admin.from("tasks").insert({
    title,
    description,
    assigned_to,
    assigned_by: user.id,
    deadline: new Date(deadlineStr).toISOString()
  });

  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `Assigned task "${title}"`,
    entity: "tasks"
  });

  // Trigger in-app notification + Push Notification
  notifyUser(assigned_to, {
    title: "📋 New Task Assigned",
    message: `You have been assigned a new task: "${title}". Due by ${new Date(deadlineStr).toLocaleDateString("en-PK")}.`,
    url: "/my-tasks"
  }).catch((err) => console.error("Task notification failed:", err));

  revalidatePath("/tasks");
  revalidatePath("/my-tasks");
}
