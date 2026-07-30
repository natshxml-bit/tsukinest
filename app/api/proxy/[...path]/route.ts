import { NextRequest, NextResponse } from "next/server";

// Sengaja TANPA prefix NEXT_PUBLIC_ — biar cuma kebaca di server,
// gak pernah kebundle ke JS yang dikirim ke browser.
const CNEST_API_URL = process.env.CNEST_API_URL;
const CNEST_API_KEY = process.env.CNEST_API_KEY;

/**
 * Proxy tipis: browser fetch ke /api/proxy/<path> (same-origin, gak ada
 * key yang keliatan), route ini yang neruskan ke cnest server-to-server
 * sambil nempelin x-api-key. Cnest URL asli + key gak pernah nyampe client.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!CNEST_API_URL) {
    return NextResponse.json(
      { error: "CNEST_API_URL belum di-set di environment" },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search; // termasuk leading "?" kalau ada

  try {
    const upstream = await fetch(`${CNEST_API_URL}/${targetPath}${search}`, {
      headers: CNEST_API_KEY ? { "x-api-key": CNEST_API_KEY } : {},
      next: { revalidate: 60 },
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghubungi backend" },
      { status: 502 },
    );
  }
}
