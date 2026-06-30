"use server";

import { sendOtp, normalizePhone } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";

export async function requestOtp(
  rawPhone: string
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  // Throttle OTP sends per phone (anti-SMS-bomb): 5 per 10 minutes.
  const rl = rateLimit(`otp:${phone}`, 5, 10 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `Too many code requests. Try again in ${rl.retryAfter}s.` };
  await sendOtp(phone);
  return { ok: true, phone };
}
