/** Proof: promo discount recompute + comp issuance (signed QR, seats blocked, no double-book). */
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";
import { createOrderFromHold } from "../lib/booking/checkout";
import { computePricing } from "../lib/pricing";
import { signTicket } from "../lib/tickets/qr";

async function main() {
  const ev = await prisma.event.findFirst({ include: { showtimes: true } });
  const st = ev!.showtimes[0];
  await prisma.ticket.deleteMany({ where: { showtimeId: st.id, state: "held" } });

  // --- PROMO (10%) ---
  const promo = await prisma.promo.create({ data: { eventId: ev!.id, code: "TEST10", type: "percent", value: 1000 } });
  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id, blocked: false }, take: 2 });
  const hold = await createHolds(st.id, seats.map((s) => s.id));
  if (!hold.ok) throw new Error("hold failed");
  const user = await prisma.user.upsert({ where: { phone: "+910000000003" }, update: {}, create: { phone: "+910000000003" } });
  const order = await createOrderFromHold(hold.holdToken, user.id);
  const discount = Math.round((order!.subtotal * promo.value) / 10000);
  const priced = computePricing({ subtotal: order!.subtotal - discount, feeType: ev!.feeType, feeValue: ev!.feeValue, gstRate: ev!.gstRate, gstInclusive: ev!.gstInclusive });
  await prisma.order.update({ where: { id: order!.id }, data: { discount, promoId: promo.id, fee: priced.fee, gst: priced.gst, total: priced.total } });
  const after = await prisma.order.findUnique({ where: { id: order!.id } });
  const promoOk = after!.total < order!.total && after!.discount === discount;
  console.log(`PROMO: subtotal=${order!.subtotal} discount=${discount} total ${order!.total}→${after!.total} ${promoOk ? "✅" : "❌"}`);

  // --- COMP ---
  const taken = new Set((await prisma.ticket.findMany({ where: { showtimeId: st.id, state: { in: ["held", "sold", "comp"] } }, select: { seatId: true } })).map((t) => t.seatId));
  const free = (await prisma.seat.findMany({ where: { showtimeId: st.id, blocked: false } })).filter((s) => !taken.has(s.id)).slice(0, 2);
  const guest = await prisma.user.upsert({ where: { phone: "+910000000004" }, update: { name: "Guest" }, create: { phone: "+910000000004", name: "Guest" } });
  const compOrder = await prisma.order.create({ data: { userId: guest.id, showtimeId: st.id, status: "paid", total: 0, paidAt: new Date() } });
  for (const s of free) {
    const t = await prisma.ticket.create({ data: { orderId: compOrder.id, showtimeId: st.id, seatId: s.id, category: s.category, price: 0, state: "comp" } });
    await prisma.ticket.update({ where: { id: t.id }, data: { qrToken: signTicket({ tid: t.id, sid: st.id }) } });
    await prisma.seat.update({ where: { id: s.id }, data: { blocked: true } });
  }
  const compTickets = await prisma.ticket.findMany({ where: { orderId: compOrder.id } });
  const allSigned = compTickets.length === free.length && compTickets.every((t) => t.qrToken);
  const blocked = await prisma.seat.count({ where: { id: { in: free.map((s) => s.id) }, blocked: true } });
  console.log(`COMP: issued=${compTickets.length} signed=${allSigned} seatsBlocked=${blocked}/${free.length} ${allSigned && blocked === free.length ? "✅" : "❌"}`);

  const rehold = await createHolds(st.id, [free[0].id]);
  console.log(`COMP seat re-hold: ${rehold.ok === false ? "✅ cannot hold a comped seat" : "❌ comped seat was holdable"}`);

  await prisma.$disconnect();
}
main();
