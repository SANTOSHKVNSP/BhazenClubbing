"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { reserveTickets, releaseHold } from "@/lib/booking/holds";
import { rateLimit } from "@/lib/ratelimit";

export async function reserveSeats(input: {
  showtimeId: string;
  slug: string;
  seatIds?: string[];
  ga?: { categoryId: string; qty: number }[];
}): Promise<{ error: string; taken: string[] } | void> {
  // Throttle holds per IP (anti-squatting / bots): 20 per minute.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`hold:${ip}`, 20, 60 * 1000);
  if (!rl.ok) return { error: `Too many attempts. Please wait ${rl.retryAfter}s and try again.`, taken: [] };

  const res = await reserveTickets(input.showtimeId, { seatIds: input.seatIds, ga: input.ga });
  if (!res.ok) {
    if (res.soldOut) return { error: `${res.soldOut} just sold out for that quantity. Please try fewer.`, taken: [] };
    return { error: "Some of those seats were just taken. Please choose again.", taken: res.taken };
  }
  redirect(`/e/${input.slug}/hold/${res.holdToken}`);
}

export async function releaseHoldAction(formData: FormData) {
  const token = String(formData.get("holdToken") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (token) await releaseHold(token);
  redirect(`/e/${slug}/seats`);
}
