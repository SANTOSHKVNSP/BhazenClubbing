import { prisma } from "../db";
import { createRazorpayRefund } from "../payments/razorpay";

export type RefundOpts = { actorId?: string; isAdmin?: boolean; reason?: string };

// Per-event refund policy (ADR-008). Admin bypasses policy; self-service is gated
// by policy type + window + fee. Frees the seats (sold → refunded) and audits.
export async function refundOrder(orderId: string, opts: RefundOpts) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { showtime: { include: { event: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "refunded") return { ok: true as const, already: true };
  if (order.status !== "paid") throw new Error("Only paid orders can be refunded");

  const event = order.showtime.event;
  let fee = 0;
  if (!opts.isAdmin) {
    if (event.refundPolicyType === "none") throw new Error("This event is non-refundable.");
    if (event.refundPolicyType === "admin_only") throw new Error("Refunds for this event are handled by support.");
    const cutoff = new Date(order.showtime.startsAt.getTime() - (event.refundWindowDays ?? 0) * 86_400_000);
    if (new Date() > cutoff) throw new Error("The refund window for this event has closed.");
    if (event.refundFeePct) fee = Math.round((order.total * event.refundFeePct) / 10000);
  }
  const amount = Math.max(0, order.total - fee);

  let razorpayRefundId: string | undefined;
  if (order.razorpayPaymentId) {
    razorpayRefundId = (await createRazorpayRefund(order.razorpayPaymentId, amount)).id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "refunded" } });
    await tx.ticket.updateMany({ where: { orderId, state: "sold" }, data: { state: "refunded" } });
    await tx.refund.create({
      data: { orderId, amount, reason: opts.reason ?? null, status: "processed", razorpayRefundId, actorId: opts.actorId },
    });
    await tx.auditLog.create({
      data: { actorId: opts.actorId, action: "refund", entity: "Order", entityId: orderId, after: { amount, fee } },
    });
  });

  return { ok: true as const, amount, fee };
}
