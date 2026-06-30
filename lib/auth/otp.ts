import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

const TTL_MIN = 5;
const MAX_ATTEMPTS = 5;

const hashCode = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

// Normalize Indian mobile numbers to +91XXXXXXXXXX.
export function normalizePhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  if (d.length === 11 && d.startsWith("0")) return `+91${d.slice(1)}`;
  return null;
}

// Phase 4 wires WhatsApp template / email here. Until then, dev-console fallback.
async function deliverOtp(_phone: string, _code: string): Promise<boolean> {
  return false;
}

export async function sendOtp(phone: string): Promise<void> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + TTL_MIN * 60 * 1000);
  await prisma.otpChallenge.deleteMany({ where: { phone } });
  await prisma.otpChallenge.create({ data: { phone, codeHash: hashCode(phone, code), expiresAt } });
  const sent = await deliverOtp(phone, code);
  if (!sent) console.log(`\n[DEV OTP] ${phone} → ${code}\n`);
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const ch = await prisma.otpChallenge.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!ch) return false;
  if (ch.expiresAt < new Date() || ch.attempts >= MAX_ATTEMPTS) {
    await prisma.otpChallenge.deleteMany({ where: { phone } });
    return false;
  }
  if (ch.codeHash !== hashCode(phone, code)) {
    await prisma.otpChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otpChallenge.deleteMany({ where: { phone } }); // consume
  return true;
}
