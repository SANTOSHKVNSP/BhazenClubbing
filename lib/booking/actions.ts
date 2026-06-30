"use server";

import { redirect } from "next/navigation";
import { createHolds, releaseHold } from "@/lib/booking/holds";

export async function reserveSeats(input: {
  showtimeId: string;
  slug: string;
  seatIds: string[];
}): Promise<{ error: string; taken: string[] } | void> {
  const res = await createHolds(input.showtimeId, input.seatIds);
  if (!res.ok) {
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
