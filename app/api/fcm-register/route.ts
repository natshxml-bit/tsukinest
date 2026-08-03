import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { verifyIdToken } from "@/lib/verifyIdToken";

export const runtime = "nodejs";

// Registrasi FCM token dari app APK: subscribe token ke topic
// "tsukinest_all" supaya broadcast dari admin langsung nyampe
// ke semua perangkat. Tanpa service account, di-skip diam-diam.
export async function POST(request: NextRequest) {
  const adminApp = getAdminApp();
  if (!adminApp) {
    return NextResponse.json(
      { ok: false, error: "FCM belum dikonfigurasi." },
      { status: 501 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const uid = await verifyIdToken(idToken, projectId);
  if (!uid) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "token wajib diisi" }, { status: 400 });
  }

  try {
    await getMessaging(adminApp).subscribeToTopic([token], "tsukinest_all");
    await getFirestore(adminApp)
      .collection("devices")
      .doc(token)
      .set(
        {
          uid,
          topic: "tsukinest_all",
          platform: "android",
          lastSeenAt: new Date(),
        },
        { merge: true }
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("fcm-register: gagal subscribe topic:", err);
    return NextResponse.json({ ok: false, error: "Gagal subscribe topic" }, { status: 500 });
  }
}
