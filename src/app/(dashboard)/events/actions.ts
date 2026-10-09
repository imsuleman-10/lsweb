"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyAllActiveMembers } from "@/lib/notifications";

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startDateStr = formData.get("start_date") as string;
  const endDateStr = formData.get("end_date") as string;
  const budget = formData.get("budget_allocated") as string;

  if (!title || !startDateStr || !endDateStr) throw new Error("Missing required fields");

  const start_date = new Date(startDateStr).toISOString();
  const end_date = new Date(endDateStr).toISOString();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("events").insert({
    title,
    description,
    location,
    start_date,
    end_date,
    budget_allocated: budget ? parseFloat(budget) : 0,
    created_by: user.id
  });

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: `Created new event: ${title}`,
    entity: "events"
  });

  revalidatePath("/events");

  // Notify all members of new event (In-app + Web Push)
  const eventDate = new Date(startDateStr).toLocaleDateString("en-PK", {
    weekday: "short", month: "short", day: "numeric"
  });
  notifyAllActiveMembers({
    title: `🗓️ New Event: ${title}`,
    message: location ? `${title} · ${eventDate} at ${location}` : `${title} · ${eventDate}`,
    url: "/events",
  }).catch(err => console.error("Event notification failed:", err));
}
