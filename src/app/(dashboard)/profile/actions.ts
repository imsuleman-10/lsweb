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

export async function updateProfile(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;

  if (!full_name?.trim()) throw new Error("Full name is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { error } = await admin.from("profiles").update({ full_name, bio }).eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/");
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) throw new Error("No file provided");

  // 5MB hard limit (client compresses below 200KB first, but as safety net)
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    throw new Error("Only JPG, PNG, or WebP images are allowed");
  }

  const path = `avatars/${user.id}.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = getAdminClient();

  // Upsert to storage (creates bucket path or overwrites)
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  // Get public URL
  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);

  // Update profile
  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  revalidatePath("/profile");
  revalidatePath("/");
}
