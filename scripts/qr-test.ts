/**
 * QR ticket proof: Ed25519 sign → verify roundtrip, tamper rejection, PNG render.
 * Run: npx tsx scripts/qr-test.ts
 */
import { prisma } from "../lib/db"; // triggers .env load (Prisma)
import { signTicket, verifyTicket, hashToken } from "../lib/tickets/qr";
import QRCode from "qrcode";

async function main() {
  const token = signTicket({ tid: "t_123", sid: "s_456" });
  const ok = verifyTicket(token);
  const tampered = verifyTicket(token.slice(0, -3) + "AAA");
  const dataUrl = await QRCode.toDataURL(token);

  console.log(`verify=${JSON.stringify(ok)} tamperedRejected=${tampered === null} qrPng=${dataUrl.startsWith("data:image/png")} hash=${hashToken(token).slice(0, 10)}`);
  const pass = ok?.tid === "t_123" && ok?.sid === "s_456" && tampered === null && dataUrl.startsWith("data:image/png");
  console.log(pass ? "✅ PASS — QR sign/verify + render" : "❌ FAIL");

  await prisma.$disconnect();
  if (!pass) process.exitCode = 1;
}
main();
