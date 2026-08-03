import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp, verifyAdmin } from "@/lib/firebaseAdmin";

// Info versi APK terbaru:
//  - GET  (publik): dipanggil UpdateNotifier di dalam app buat ngecek
//    apakah versi terpasang udah ketinggalan. Baca via Admin SDK
//    (server-side) biar gak bergantung Firestore Security Rules client.
//  - POST (admin): dipakai dashboard admin buat set versi + URL download.
export const runtime = "nodejs";

export async function GET() {
  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json({ version: null, error: null });
    }

    const snap = await getFirestore(adminApp).doc("appMeta/latest").get();
    if (!snap.exists) {
      return NextResponse.json({ version: null, error: null });
    }

    const data = snap.data() as {
      versionName?: string;
      versionCode?: number;
      apkUrl?: string;
      notes?: string;
      releasedAt?: unknown;
    };

    return NextResponse.json({
      version: {
        versionName: data.versionName ?? "",
        versionCode: data.versionCode ?? 0,
        apkUrl: data.apkUrl ?? "",
        notes: data.notes ?? "",
        releasedAt: data.releasedAt ?? null,
      },
      error: null,
    });
  } catch (err) {
    console.error("latest-version: error tak terduga:", err);
    return NextResponse.json({ version: null, error: "Internal" });
  }
}

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
      versionName?: string;
      versionCode?: number;
      apkUrl?: string;
      notes?: string;
    };
    const versionName = body.versionName?.trim();
    const versionCode = Number(body.versionCode);
    const apkUrl = body.apkUrl?.trim();
    if (!versionName || !Number.isFinite(versionCode) || versionCode <= 0 || !apkUrl) {
      return NextResponse.json(
        { ok: false, error: "versionName, versionCode (angka), dan apkUrl wajib diisi" },
        { status: 400 }
      );
    }

    await getFirestore(adminApp)
      .collection("appMeta")
      .doc("latest")
      .set(
        {
          versionName,
          versionCode,
          apkUrl,
          notes: body.notes?.trim() ?? "",
          releasedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("latest-version: error tak terduga:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Internal: ${msg}` }, { status: 500 });
  }
}
