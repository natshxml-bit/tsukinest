import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Satu-satunya jalur FCM Admin SDK. Inisialisasi lazy: kalau env
// FIREBASE_SERVICE_ACCOUNT (JSON string) belum di-set, push cuma skip
// dan broadcast tetap tersimpan di Firestore (via client admin page).
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
  } catch (err) {
    console.error("broadcast: gagal init firebase-admin:", err);
    return null;
  }
}

async function isAdmin(adminApp: App, idToken: string): Promise<boolean> {
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    const snap = await getFirestore(adminApp).doc(`users/${decoded.uid}`).get();
    return snap.exists && snap.data()?.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const adminApp = getAdminApp();
  if (!adminApp) {
    return NextResponse.json(
      { ok: false, error: "FCM belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT di env." },
      { status: 501 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(adminApp, idToken))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    message?: string;
    slug?: string;
  };
  const title = body.title?.trim();
  const message = body.message?.trim();
  if (!title || !message) {
    return NextResponse.json({ ok: false, error: "title & message wajib diisi" }, { status: 400 });
  }

  try {
    await getMessaging(adminApp).send({
      topic: "tsukinest_all",
      notification: { title, body: message },
      data: {
        type: "announcement",
        slug: body.slug?.trim() ?? "",
      },
      android: { priority: "high" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("broadcast: gagal kirim FCM:", err);
    return NextResponse.json({ ok: false, error: "Gagal kirim push" }, { status: 500 });
  }
}
