"use client";
// components/PushNotificationsHandler.tsx
// Setup push notification native (APK webview):
//  1. Minta izin + register FCM (cuma jalan di platform native)
//  2. Kirim token ke /api/fcm-register → subscribe topic "tsukinest_all"
//  3. Pas app lagi foreground, notif ditampilin lewat LocalNotifications
//     biar tetap muncul "kaya notif WA" walau app lagi dibuka
//
// Dipasang SEKALI di app/layout.tsx. Web biasa di-skip otomatis.
//
// Self-healing: token dan status login muncul di waktu berbeda (token
// sering keburu muncul sebelum session auth restor). Jadi dua-duanya
// disimpan, dan subscribe dijalankan setiap kali salah satunya berubah
// — begitu dua-duanya lengkap, langsung di-subscribe.

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export default function PushNotificationsHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let fcmToken: string | null = null;
    let currentUser: User | null = null;

    const subscribe = async () => {
      if (!fcmToken || !currentUser) return;
      try {
        const idToken = await currentUser.getIdToken();
        await fetch("/api/fcm-register", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ token: fcmToken }),
        });
      } catch (err) {
        console.error("PushNotificationsHandler: subscribe topic gagal:", err);
      }
    };

    const register = async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;
        await PushNotifications.register();
      } catch (err) {
        console.error("PushNotificationsHandler: izin/register gagal:", err);
      }
    };

    const onRegistration = (data: { value: string }) => {
      fcmToken = data.value;
      subscribe();
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
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      subscribe();
    });

    return () => {
      unsubReg.then((handle) => handle.remove());
      unsubRecv.then((handle) => handle.remove());
      unsubAuth();
    };
  }, []);

  return null;
}
