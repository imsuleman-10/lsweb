"use client";

import { useEffect, useState } from "react";
import { saveSubscription } from "@/app/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const LS_KEY = "push_subscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Already subscribed — save it again in case DB is out of sync
    const j = existing.toJSON();
    await saveSubscription({ endpoint: j.endpoint!, p256dh: j.keys!.p256dh!, auth: j.keys!.auth! });
    localStorage.setItem(LS_KEY, "1");
    return true;
  }

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const j = sub.toJSON();
    await saveSubscription({ endpoint: j.endpoint!, p256dh: j.keys!.p256dh!, auth: j.keys!.auth! });
    localStorage.setItem(LS_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function PushManager() {
  const [permState, setPermState] = useState<"idle" | "denied">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function init() {
      try {
        // Register SW
        await navigator.serviceWorker.register("/sw.js");

        // Already subscribed before
        if (localStorage.getItem(LS_KEY)) {
          await subscribeToPush(); // re-sync with DB silently
          return;
        }

        // Permission already granted → subscribe silently, no popup
        if (Notification.permission === "granted") {
          await subscribeToPush();
          return;
        }

        // Permission denied → nothing we can do
        if (Notification.permission === "denied") {
          setPermState("denied");
          return;
        }

        // Permission is "default" → auto-request immediately
        // This triggers the native browser permission dialog
        const result = await Notification.requestPermission();
        if (result === "granted") {
          await subscribeToPush();
        } else {
          setPermState("denied");
        }
      } catch (err) {
        console.error("Push init error:", err);
      }
    }

    // Small delay so page renders first before browser dialog appears
    const t = setTimeout(init, 1500);
    return () => clearTimeout(t);
  }, []);

  // Nothing to render — this is a headless manager component
  return null;
}
