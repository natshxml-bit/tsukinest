"use client";
// components/PushNotificationsHandler.tsx
// Setup push notification native (APK webview):
//  1. Minta izin + register FCM (cuma jalan di platform native)
//  2. Kirim token ke /api/fcm-register → subscribe topic "tsukinest_all"
//  3. Pas app lagi foreground, notif ditampilin lewat LocalNotifications
//     biar tetap muncul "kaya notif WA" walau app lagi dibuka
//
// Dipasang SEKALI di app/layout.tsx. Web biasa di-skip otomatis.

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { auth } from "@/lib/firebase";

export default function PushNotificationsHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const register = async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;
        await PushNotifications.register();
      } catch (err) {
        console.error("PushNotificationsHandler: izin/register gagal:", err);
      }
    };

    const onRegistration = async (data: { value: string }) => {
      try {
        const token = data.value;
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        await fetch("/api/fcm-register", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.error("PushNotificationsHandler: subscribe topic gagal:", err);
      }
    };

    const onReceived = (notification: {
      title?: string;
      body?: string;
      data?: Record<string, string>;
    }) => {
      try {
        LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title ?? "TsukiNest",
              body: notification.body ?? "",
              extra: { slug: notification.data?.slug ?? "" },
            },
          ],
        });
      } catch (err) {
        console.error("PushNotificationsHandler: local notif gagal:", err);
      }
    };

    register();
    const unsubReg = PushNotifications.addListener("registration", onRegistration);
    const unsubRecv = PushNotifications.addListener("pushNotificationReceived", onReceived);

    return () => {
      unsubReg.then((handle) => handle.remove());
      unsubRecv.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
