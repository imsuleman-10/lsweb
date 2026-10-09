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

export async function submitPoem(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const language = formData.get("language") as string;

  if (!title || !content) throw new Error("Title and content are required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { error } = await admin.from("poetry").insert({
    title, content, language: language || "Urdu", author_id: user.id
  });
  if (error) throw new Error(error.message);

  revalidatePath("/poetry");
}

export async function deletePoem(poemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "member";
  const admin = getAdminClient();

  // Fetch the poem to check ownership
  const { data: poem } = await admin
    .from("poetry")
    .select("author_id")
    .eq("id", poemId)
    .single();

  if (!poem) throw new Error("Poem not found");

  const isCoreBodyOrAbove = ["super_admin", "corebody"].includes(role);
  const isOwner = poem.author_id === user.id;

  if (!isCoreBodyOrAbove && !isOwner) {
    throw new Error("Forbidden: You can only delete your own poems.");
  }

  const { error } = await admin.from("poetry").delete().eq("id", poemId);
  if (error) throw new Error(error.message);

  revalidatePath("/poetry");
}
