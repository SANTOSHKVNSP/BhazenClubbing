import { createPrivateKey, createPublicKey, sign, verify, createHash } from "node:crypto";

// Ed25519-signed ticket QR (ADR-015). Token = base64url(payload).base64url(signature).
// Keys are base64-encoded PEM in env (private server-only; public shippable to scanners).

const pem = (b64: string) => Buffer.from(b64, "base64").toString("utf8");

function privateKey() {
  const b64 = process.env.QR_SIGNING_PRIVATE_KEY;
  if (!b64) throw new Error("QR_SIGNING_PRIVATE_KEY not set");
  return createPrivateKey(pem(b64));
}
function publicKey() {
  const b64 = process.env.QR_SIGNING_PUBLIC_KEY;
  if (!b64) throw new Error("QR_SIGNING_PUBLIC_KEY not set");
  return createPublicKey(pem(b64));
}

export type TicketPayload = { tid: string; sid: string; iat: number };

export function signTicket(p: { tid: string; sid: string }): string {
  const body = Buffer.from(JSON.stringify({ ...p, iat: Date.now() })).toString("base64url");
  const sig = sign(null, Buffer.from(body), privateKey()).toString("base64url");
  return `${body}.${sig}`;
}

export function verifyTicket(token: string): TicketPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!verify(null, Buffer.from(body), publicKey(), Buffer.from(sig, "base64url"))) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString()) as TicketPayload;
  } catch {
    return null;
  }
}

// Stable hash used in the scanner allowlist (offline membership check).
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const publicKeyB64 = () => process.env.QR_SIGNING_PUBLIC_KEY ?? "";
