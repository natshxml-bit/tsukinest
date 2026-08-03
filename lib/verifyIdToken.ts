import crypto from "node:crypto";

// Verifikasi Firebase ID token TANPA firebase-admin/auth.
// Alasan: firebase-admin/auth narik jwks-rsa -> jose (ESM-only), dan di
// Vercel firebase-admin di-external-kan (gak dibundle), jadi require()
// CJS dari jwks-rsa ke jose bikin route crash dengan "require() of ES
// Module not supported". Di sini signature token diverifikasi langsung
// pakai node:crypto + public keys Google (securetoken).
// Referensi: https://firebase.google.com/docs/auth/admin/verify-id-tokens

const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cachedKeys: { keys: Record<string, string>; expiresAt: number } | null = null;

async function getPublicKeys(): Promise<Record<string, string>> {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) {
    return cachedKeys.keys;
  }
  const res = await fetch(CERT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`gagal ambil public key Google: HTTP ${res.status}`);
  const keys = (await res.json()) as Record<string, string>;
  cachedKeys = { keys, expiresAt: Date.now() + CACHE_TTL_MS };
  return keys;
}

function base64UrlDecode(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}

/**
 * Verifikasi ID token Firebase lalu balikin `uid`. Return null kalau
 * token invalid/kedaluwarsa/salah project.
 */
export async function verifyIdToken(
  idToken: string,
  projectId: string,
): Promise<string | null> {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64UrlDecode(headerB64)) as { kid?: string };
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as {
      exp?: number;
      aud?: string;
      iss?: string;
      user_id?: string;
      sub?: string;
    };

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    const keys = await getPublicKeys();
    const pem = header.kid ? keys[header.kid] : undefined;
    if (!pem) return null;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const signature = Buffer.from(
      signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
    if (!verifier.verify(pem, signature)) return null;

    return payload.user_id ?? payload.sub ?? null;
  } catch {
    return null;
  }
}
