import { createAdminClient } from "@/utils/supabase/admin";
import { sendPushNotification, broadcastPushNotification } from "@/app/actions/push";

interface NotificationOptions {
  title?: string;
  message: string;
  url?: string;
}

/**
 * Send in-app notification + web push to a single user.
 */
export async function notifyUser(userId: string, options: NotificationOptions) {
  if (!userId) return;
  const admin = createAdminClient();

  // 1. In-app notification
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      message: options.message,
      is_read: false,
    });
  } catch (err) {
    console.warn("[notifyUser] Failed to insert in-app notification:", err);
  }

  // 2. Web push notification
  try {
    await sendPushNotification(userId, {
      title: options.title || "Literary Society UET",
      body: options.message,
      url: options.url || "/notifications",
    });
  } catch (err) {
    console.warn("[notifyUser] Push notification failed:", err);
  }
}

/**
 * Send in-app notification + web push to multiple specific users.
 */
export async function notifyUsers(userIds: string[], options: NotificationOptions) {
  if (!userIds || userIds.length === 0) return;
  const admin = createAdminClient();

  // Deduplicate
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  // 1. In-app notifications in batch
  try {
    const rows = uniqueIds.map((uid) => ({
      user_id: uid,
      message: options.message,
      is_read: false,
    }));
    await admin.from("notifications").insert(rows);
  } catch (err) {
    console.warn("[notifyUsers] In-app notification batch insert failed:", err);
  }

  // 2. Web push notifications
  await Promise.allSettled(
    uniqueIds.map((uid) =>
      sendPushNotification(uid, {
        title: options.title || "Literary Society UET",
        body: options.message,
        url: options.url || "/notifications",
      })
    )
  );
}

/**
 * Broadcast in-app notification to ALL active society members + Web Push broadcast.
 * Used for announcements, society-wide events, etc.
 */
export async function notifyAllActiveMembers(options: NotificationOptions) {
  const admin = createAdminClient();

  try {
    // 1. Fetch all active members
    const { data: members, error } = await admin
      .from("profiles")
      .select("id")
      .eq("status", "active");

    if (!error && members && members.length > 0) {
      const rows = members.map((m) => ({
        user_id: m.id,
        message: options.message,
        is_read: false,
      }));

      // Insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        await admin.from("notifications").insert(rows.slice(i, i + chunkSize));
      }
    }
  } catch (err) {
    console.warn("[notifyAllActiveMembers] In-app broadcast failed:", err);
  }

  // 2. Web push broadcast
  try {
    await broadcastPushNotification({
      title: options.title || "📢 Literary Society",
      body: options.message,
      url: options.url || "/notifications",
    });
  } catch (err) {
    console.warn("[notifyAllActiveMembers] Web push broadcast failed:", err);
  }
}
