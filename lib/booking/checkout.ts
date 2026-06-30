import { prisma } from "../db";
import { computePricing } from "../pricing";
import { releaseExpiredHolds } from "./holds";
import { signTicket } from "../tickets/qr";
import { notify } from "../notify";

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

    // GST invoice with a gap-free number (Counter incremented in this txn).
    const c = await tx.counter.upsert({
      where: { key: "invoice" },
      create: { key: "invoice", value: 1 },
      update: { value: { increment: 1 } },
    });
    await tx.invoice.create({
      data: {
        orderId,
        number: `SB/${new Date().getFullYear()}/${String(c.value).padStart(5, "0")}`,
        gstin: process.env.AOL_GSTIN ?? "GSTIN-PENDING",
        sac: process.env.INVOICE_SAC ?? "998554",
        breakdown: { subtotal: order.subtotal, fee: order.fee, gst: order.gst, total: order.total },
      },
    });
  });

  // Sign a QR token per newly-sold ticket (idempotent — only those missing one).
  const unsigned = await prisma.ticket.findMany({ where: { orderId, state: "sold", qrToken: null } });
  for (const t of unsigned) {
    await prisma.ticket.update({
      where: { id: t.id },
      data: { qrToken: signTicket({ tid: t.id, sid: t.showtimeId }) },
    });
  }

  // First-fulfillment only: send confirmation (email + WhatsApp; dev-console fallback).
  if (unsigned.length > 0) {
    try {
      const o = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, tickets: { include: { seat: true } }, showtime: { include: { event: true } } },
      });
      if (o) {
        const seats = o.tickets.map((t) => `${t.seat.row}${t.seat.number}`).join(", ");
        await notify({
          email: o.user.email ?? undefined,
          phone: o.user.phone,
          subject: `Your ${o.showtime.event.title} tickets`,
          body: `Booking confirmed! Seats ${seats}. View your tickets at ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/account`,
        });
      }
    } catch {
      // delivery failure must not block fulfillment
    }
  }
}
