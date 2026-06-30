/** Demo data so the gated screens have content: a paid order for the super admin,
 *  a comp, a promo, and a pending event (to show the approval workflow). */
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";
import { createOrderFromHold, fulfillOrder } from "../lib/booking/checkout";
import { signTicket } from "../lib/tickets/qr";

async function main() {
  const ev = await prisma.event.findFirst({ where: { slug: "bhazen-clubbing" }, include: { showtimes: true } });
  const st = ev!.showtimes[0];
  await prisma.ticket.deleteMany({ where: { showtimeId: st.id, state: "held" } });

  // Paid order owned by the super admin → analytics revenue + /account + a ticket.
  const superUser = await prisma.user.findUnique({ where: { phone: "+919999999999" } });
  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id, blocked: false }, take: 2 });
  const hold = await createHolds(st.id, seats.map((s) => s.id));
  let orderId = "", ticketId = "";
  if (hold.ok) {
    const order = await createOrderFromHold(hold.holdToken, superUser!.id);
    await fulfillOrder(order!.id, "demo_payment");
    orderId = order!.id;
    ticketId = (await prisma.ticket.findFirst({ where: { orderId } }))!.id;
  }

  // A comp (analytics comps + audit entry).
  const taken = new Set((await prisma.ticket.findMany({ where: { showtimeId: st.id, state: { in: ["held", "sold", "comp"] } }, select: { seatId: true } })).map((t) => t.seatId));
  const free = (await prisma.seat.findMany({ where: { showtimeId: st.id, blocked: false } })).filter((s) => !taken.has(s.id)).slice(0, 2);
  const guest = await prisma.user.upsert({ where: { phone: "+917777700000" }, update: { name: "Demo Guest" }, create: { phone: "+917777700000", name: "Demo Guest" } });
  const compOrder = await prisma.order.create({ data: { userId: guest.id, showtimeId: st.id, status: "paid", total: 0, paidAt: new Date() } });
  for (const s of free) {
    const t = await prisma.ticket.create({ data: { orderId: compOrder.id, showtimeId: st.id, seatId: s.id, category: s.category, price: 0, state: "comp" } });
    await prisma.ticket.update({ where: { id: t.id }, data: { qrToken: signTicket({ tid: t.id, sid: st.id }) } });
    await prisma.seat.update({ where: { id: s.id }, data: { blocked: true } });
  }
  await prisma.comp.create({ data: { eventId: ev!.id, name: "Demo Guest", phone: "+917777700000", qty: free.length } });
  await prisma.auditLog.create({ data: { actorId: superUser!.id, action: "comp", entity: "Event", entityId: ev!.id, after: { name: "Demo Guest", qty: free.length } } });

  // A promo on the live event (shows in the editor).
  await prisma.promo.upsert({ where: { eventId_code: { eventId: ev!.id, code: "SATTVICK10" } }, update: {}, create: { eventId: ev!.id, code: "SATTVICK10", type: "percent", value: 1000, maxUses: 100 } });

  // A pending event (to show the approval panel).
  const pending = await prisma.event.upsert({
    where: { slug: "sattvick-bengaluru" },
    update: { status: "pending" },
    create: { slug: "sattvick-bengaluru", title: "Sattvick Beats — Bengaluru", cityId: ev!.cityId, status: "pending", submittedById: superUser!.id },
  });
  await prisma.auditLog.create({ data: { actorId: superUser!.id, action: "submit", entity: "Event", entityId: pending.id } });

  console.log(`LIVE_EVENT=${ev!.id}`);
  console.log(`PENDING_EVENT=${pending.id}`);
  console.log(`ORDER=${orderId}`);
  console.log(`TICKET=${ticketId}`);
  await prisma.$disconnect();
}
main();
