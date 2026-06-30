"use server";

import { sendOtp, normalizePhone } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";

export async function requestOtp(
  rawPhone: string
): Promise<{ ok: true; phone: string; devCode?: string } | { ok: false; error: string }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  // Throttle OTP sends per phone (anti-SMS-bomb): 5 per 10 minutes.
  const rl = rateLimit(`otp:${phone}`, 5, 10 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `Too many code requests. Try again in ${rl.retryAfter}s.` };
  const code = await sendOtp(phone);
  // Dev only: surface the code so login is self-serve (never returned in production).
  return { ok: true, phone, devCode: process.env.NODE_ENV !== "production" ? code : undefined };
}
