"use server";

import { sendOtp, normalizePhone } from "@/lib/auth/otp";

export async function requestOtp(
  rawPhone: string
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  await sendOtp(phone);
  return { ok: true, phone };
}
