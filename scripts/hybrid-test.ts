/** Proof: hybrid order (reserved premium seat + GA) holds atomically, fulfills with
 *  a QR per ticket, and refund frees the GA counter (ADR-021). */
import { prisma } from "../lib/db";
import { reserveTickets } from "../lib/booking/holds";
import { createOrderFromHold, fulfillOrder } from "../lib/booking/checkout";
import { refundOrder } from "../lib/booking/refunds";
import { verifyTicket } from "../lib/tickets/qr";

async function main() {
  const ev = await prisma.event.findFirst({ where: { slug: "bhazen-jamming" }, include: { showtimes: true, categories: true } });
  const st = ev!.showtimes[0];
  const gen = ev!.categories.find((c) => c.name === "General")!;
  const seat = await prisma.seat.findFirst({ where: { showtimeId: st.id, category: "Premium", blocked: false } });
  const invKey = { showtimeId_ticketCategoryId: { showtimeId: st.id, ticketCategoryId: gen.id } };

  // Hybrid hold: 1 premium seat + 2 General GA, one transaction
  const hold = await reserveTickets(st.id, { seatIds: [seat!.id], ga: [{ categoryId: gen.id, qty: 2 }] });
  if (!hold.ok) throw new Error("hold failed");
  const held = await prisma.ticket.count({ where: { holdToken: hold.holdToken, state: "held" } });
  const invHold = await prisma.gaInventory.findUnique({ where: invKey });
  console.log(`hold: count=${hold.count} held=${held} General.reserved=${invHold?.reserved}`);

  // Order + fulfill
  const user = await prisma.user.upsert({ where: { phone: "+910000000009" }, update: {}, create: { phone: "+910000000009" } });
  const order = await createOrderFromHold(hold.holdToken, user.id);
  await fulfillOrder(order!.id, "hybrid_test");
  const sold = await prisma.ticket.findMany({ where: { orderId: order!.id } });
  const seatN = sold.filter((t) => t.seatId).length;
  const gaN = sold.filter((t) => !t.seatId).length;
  const signed = sold.length === 3 && sold.every((t) => t.qrToken && verifyTicket(t.qrToken));
  console.log(`fulfill: sold=${sold.length} (seat=${seatN}, ga=${gaN}) allSigned=${signed} total=₹${(order!.total / 100).toLocaleString("en-IN")}`);

  // Refund frees GA capacity + the premium seat
  await refundOrder(order!.id, { isAdmin: true, actorId: "test" });
  const invRef = await prisma.gaInventory.findUnique({ where: invKey });
  console.log(`refund: General.reserved=${invRef?.reserved}`);

  const pass = held === 3 && invHold?.reserved === 2 && signed && seatN === 1 && gaN === 2 && invRef?.reserved === 0;
  console.log(pass ? "✅ HYBRID order: mixed hold → sold (QR each) → refund frees GA" : "❌ FAIL");
  await prisma.$disconnect();
  if (!pass) process.exitCode = 1;
}
main();
