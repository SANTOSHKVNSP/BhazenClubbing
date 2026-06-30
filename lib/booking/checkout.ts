import { prisma } from "../db";
import { computePricing } from "../pricing";
import { releaseExpiredHolds } from "./holds";

// Convert a valid hold into a pending Order with computed pricing, attaching tickets.
export async function createOrderFromHold(holdToken: string, userId: string) {
  await releaseExpiredHolds();

  const tickets = await prisma.ticket.findMany({
    where: { holdToken, state: "held" },
    include: { showtime: { include: { event: true } } },
  });
  if (tickets.length === 0) return null;

  const event = tickets[0].showtime.event;
  const subtotal = tickets.reduce((s, t) => s + t.price, 0);
  const pricing = computePricing({
    subtotal,
    feeType: event.feeType,
    feeValue: event.feeValue,
    gstRate: event.gstRate,
    gstInclusive: event.gstInclusive,
  });

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        showtimeId: tickets[0].showtimeId,
        status: "pending",
        subtotal: pricing.subtotal,
        fee: pricing.fee,
        gst: pricing.gst,
        total: pricing.total,
      },
    });
    await tx.ticket.updateMany({ where: { holdToken, state: "held" }, data: { orderId: order.id } });
    return order;
  });
}

// Idempotent fulfillment: pending → paid, held tickets → sold. Used by dev-pay now
// and by the Razorpay webhook when keys are configured.
export async function fulfillOrder(orderId: string, razorpayPaymentId?: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "paid") return;
    await tx.order.update({
      where: { id: orderId },
      data: { status: "paid", paidAt: new Date(), razorpayPaymentId: razorpayPaymentId ?? order.razorpayPaymentId },
    });
    await tx.ticket.updateMany({
      where: { orderId, state: "held" },
      data: { state: "sold", holdToken: null, expiresAt: null },
    });
  });
}
