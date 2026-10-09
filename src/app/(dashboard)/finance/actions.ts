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

export async function createTransaction(formData: FormData) {
  const type = formData.get("type") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const reference_id = formData.get("reference_id") as string;

  if (!type || isNaN(amount) || !category) throw new Error("Missing required fields");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") throw new Error("Forbidden: Only the Treasurer can record transactions.");

  const admin = getAdminClient();
  const { error } = await admin.from("transactions").insert({
    type, amount, category, description, reference_id, recorded_by: user.id
  });
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `Recorded ${type} of PKR ${amount} for ${category}`,
    entity: "transactions"
  });

  revalidatePath("/finance");
  revalidatePath("/");
}
