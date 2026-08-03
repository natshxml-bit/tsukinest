import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/verifyIdToken";

// Helper server-side bersama untuk route API yang butuh firebase-admin.
// PENTING: sengaja gak pernah import firebase-admin/auth di sini — modul
// itu narik jwks-rsa -> jose (ESM-only) yang bikin route crash di Vercel
// ("require() of ES Module not supported"). Verifikasi token dipindah ke
// verifyIdToken() (node:crypto murni).

let app: App | null = null;

export function getAdminApp(): App | null {
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
    console.error("firebaseAdmin: gagal init firebase-admin:", err);
    return null;
  }
}

export async function verifyAdmin(idToken: string): Promise<boolean> {
  try {
    const adminApp = getAdminApp();
    if (!adminApp) return false;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
    const uid = await verifyIdToken(idToken, projectId);
    if (!uid) return false;
    const snap = await getFirestore(adminApp).doc(`users/${uid}`).get();
    return snap.exists && snap.data()?.role === "admin";
  } catch {
    return false;
  }
}
