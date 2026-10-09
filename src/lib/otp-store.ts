import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface OTPRecord {
  id?: string;
  email: string;
  full_name: string;
  otp: string;
  password_enc: string;
  expires_at: string;
  phylum_id?: string | null;
  used?: boolean;
}

// In-memory fallback map (persists in Node.js process runtime)
declare global {
  var __otpStore: Map<string, OTPRecord> | undefined;
}

if (!globalThis.__otpStore) {
  globalThis.__otpStore = new Map<string, OTPRecord>();
}
const memoryStore = globalThis.__otpStore;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function saveOTPRecord(record: {
  email: string;
  full_name: string;
  otp: string;
  password_enc: string;
  expires_at: string;
  phylum_id?: string | null;
}): Promise<void> {
  const normEmail = record.email.toLowerCase().trim();
  const admin = getAdminClient();

  // Always update memory store as immediate reliable fallback
  memoryStore.set(normEmail, {
    ...record,
    email: normEmail,
    phylum_id: record.phylum_id || null,
    used: false,
  });

  // Try saving to Supabase otp_verifications table if it exists
  try {
    await admin.from("otp_verifications").delete().eq("email", normEmail);

    const { error } = await admin.from("otp_verifications").insert({
      email: normEmail,
      full_name: record.full_name,
      otp: record.otp,
      password_enc: record.password_enc,
      expires_at: record.expires_at,
    });

    if (error) {
      console.warn("[OTP Store] Supabase table insert notice (using memory fallback):", error.message);
    }
  } catch (err: any) {
    console.warn("[OTP Store] Supabase table error, fallback active:", err.message);
  }
}

export async function getLatestOTPRecord(email: string): Promise<OTPRecord | null> {
  const normEmail = email.toLowerCase().trim();
  const admin = getAdminClient();

  // Try Supabase first
  try {
    const { data, error } = await admin
      .from("otp_verifications")
      .select("*")
      .eq("email", normEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as OTPRecord;
    }
  } catch {
    // ignore and fallback
  }

  // Fallback to memory store
  const memRecord = memoryStore.get(normEmail);
  if (memRecord && !memRecord.used) {
    return memRecord;
  }

  return null;
}

export async function updateOTPRecord(email: string, newOtp: string, newExpiresAt: string): Promise<void> {
  const normEmail = email.toLowerCase().trim();
  const admin = getAdminClient();

  const memRecord = memoryStore.get(normEmail);
  if (memRecord) {
    memRecord.otp = newOtp;
    memRecord.expires_at = newExpiresAt;
    memoryStore.set(normEmail, memRecord);
  }

  try {
    await admin
      .from("otp_verifications")
      .update({ otp: newOtp, expires_at: newExpiresAt })
      .eq("email", normEmail);
  } catch {
    // ignore
  }
}

export async function deleteOTPRecord(email: string, id?: string): Promise<void> {
  const normEmail = email.toLowerCase().trim();
  const admin = getAdminClient();

  memoryStore.delete(normEmail);

  try {
    if (id) {
      await admin.from("otp_verifications").delete().eq("id", id);
    } else {
      await admin.from("otp_verifications").delete().eq("email", normEmail);
    }
  } catch {
    // ignore
  }
}
