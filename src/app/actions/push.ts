"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import webPush from "web-push";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublic && vapidPrivate) {
  webPush.setVapidDetails("mailto:admin@lsweb.app", vapidPublic, vapidPrivate);
}

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function saveSubscription(subData: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = getAdmin();
  await admin.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint: subData.endpoint, p256dh: subData.p256dh, auth: subData.auth },
    { onConflict: "endpoint" }
  );
}

/**
 * Send push notification to a single user by their user_id.
 * Used for task assignments, role changes, etc.
 */
export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string; icon?: string }
) {
  if (!vapidPublic || !vapidPrivate) return;
  const admin = getAdmin();

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon.png",
    url: payload.url || "/",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err: any) {
        // Expired or invalid subscription — clean up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

/**
 * Broadcast push notification to ALL active members.
 * Used for announcements, events, etc.
 */
export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  if (!vapidPublic || !vapidPrivate) return;
  const admin = getAdmin();

  // Get all subscriptions for active users
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icon.png",
    url: payload.url || "/",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
