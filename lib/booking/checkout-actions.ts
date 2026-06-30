"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createOrderFromHold, fulfillOrder } from "@/lib/booking/checkout";
import { refundOrder } from "@/lib/booking/refunds";

export async function proceedToCheckout(formData: FormData) {
  const holdToken = String(formData.get("holdToken") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/e/${slug}/hold/${holdToken}`)}`);
  }

  const order = await createOrderFromHold(holdToken, session.user.id);
  if (!order) redirect(`/e/${slug}/seats`); // hold expired
  redirect(`/checkout/${order.id}`);
}

// Dev-mode payment: simulate a successful capture (real path is the Razorpay webhook).
export async function payDev(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const session = await auth();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session?.user?.id) redirect("/");
  await fulfillOrder(orderId, "dev_payment");
  redirect(`/checkout/${orderId}/confirmed`);
}

// Self-service refund — policy-gated inside refundOrder (ADR-008).
export async function selfRefund(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) redirect("/account");
  await refundOrder(orderId, { actorId: session.user.id });
  redirect("/account");
}
