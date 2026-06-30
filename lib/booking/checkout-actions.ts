"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createOrderFromHold, fulfillOrder } from "@/lib/booking/checkout";
import { refundOrder } from "@/lib/booking/refunds";
import { computePricing } from "@/lib/pricing";

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

// Apply a promo code to a pending order: discount the subtotal, then recompute fee/GST.
export async function applyPromo(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { showtime: { include: { event: true } } },
  });
  if (!order || order.userId !== session.user.id) redirect("/account");
  if (order.status !== "pending" || order.promoId) redirect(`/checkout/${orderId}`);

  const promo = await prisma.promo.findUnique({ where: { eventId_code: { eventId: order.showtime.eventId, code } } });
  const now = new Date();
  const valid =
    promo &&
    (!promo.startsAt || promo.startsAt <= now) &&
    (!promo.endsAt || promo.endsAt > now) &&
    (promo.maxUses == null || promo.usedCount < promo.maxUses);
  if (!promo || !valid) redirect(`/checkout/${orderId}?promo=invalid`);

  const discount = promo.type === "percent"
    ? Math.round((order.subtotal * promo.value) / 10000)
    : Math.min(promo.value, order.subtotal);
  const ev = order.showtime.event;
  const priced = computePricing({
    subtotal: order.subtotal - discount,
    feeType: ev.feeType,
    feeValue: ev.feeValue,
    gstRate: ev.gstRate,
    gstInclusive: ev.gstInclusive,
  });
  await prisma.order.update({
    where: { id: orderId },
    data: { discount, promoId: promo.id, fee: priced.fee, gst: priced.gst, total: priced.total },
  });
  await prisma.promo.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
  redirect(`/checkout/${orderId}?promo=applied`);
}
