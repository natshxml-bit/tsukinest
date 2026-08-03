import { NextRequest, NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp, verifyAdmin } from "@/lib/firebaseAdmin";

// Firebase Admin cuma jalan di Node.js (butuh process.env, crypto, dll).
// Wajib dinyatakan eksplisit supaya gak pernah dibundle sebagai Edge
// function — kalau jadi Edge, route langsung crash di module load.
export const runtime = "nodejs";

// Broadcast pengumuman: tulis ke Firestore (via client admin page, biar
// muncul di popup web) + kirim push FCM ke topic "tsukinest_all" (buat
// notif APK). Kalau FIREBASE_SERVICE_ACCOUNT belum di-set, push di-skip.
export async function POST(request: NextRequest) {
  try {
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
    if (!(await verifyAdmin(idToken))) {
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
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: `Gagal kirim push: ${msg}` }, { status: 500 });
    }
  } catch (err) {
    console.error("broadcast: error tak terduga:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Internal: ${msg}` }, { status: 500 });
  }
}
