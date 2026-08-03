import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

// Registrasi FCM token dari app APK: subscribe token ke topic
// "tsukinest_all" supaya broadcast dari admin langsung nyampe
// ke semua perangkat. Tanpa service account, di-skip diam-diam.
let app: App | null = null;

function getAdminApp(): App | null {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!serviceAccountJson || !projectId) return null;
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    return app;
  } catch {
    return null;
  }
}

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
  try {
    await getAuth(adminApp).verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "token wajib diisi" }, { status: 400 });
  }

  try {
    await getMessaging(adminApp).subscribeToTopic([token], "tsukinest_all");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("fcm-register: gagal subscribe topic:", err);
    return NextResponse.json({ ok: false, error: "Gagal subscribe topic" }, { status: 500 });
  }
}
