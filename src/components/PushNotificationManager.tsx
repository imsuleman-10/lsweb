"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      const sub = await registration.pushManager.getSubscription();
      if (!sub) {
        requestNotificationPermission();
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      subscribeUser();
    }
  }

  async function subscribeUser() {
    if (!publicVapidKey) {
      console.error('VAPID public key not found in env');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subJSON = subscription.toJSON();
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys?.p256dh,
          auth: subJSON.keys?.auth
        }, { onConflict: 'user_id, endpoint' });
      }
    } catch (error) {
      console.error('Failed to subscribe user:', error);
    }
  }

  return null; // Invisible component
}
