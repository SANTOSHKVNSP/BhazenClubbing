/**
 * Refund proof: paid order → admin refund → seats FREED + invoice generated.
 * Run: npx tsx scripts/refund-test.ts
 */
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";
import { createOrderFromHold, fulfillOrder } from "../lib/booking/checkout";
import { refundOrder } from "../lib/booking/refunds";

async function main() {
  const st = await prisma.showtime.findFirst();
  if (!st) throw new Error("seed first");
  await prisma.ticket.deleteMany({ where: { showtimeId: st.id, state: "held" } });

  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id }, take: 2 });
  const hold = await createHolds(st.id, seats.map((s) => s.id));
  if (!hold.ok) throw new Error("hold failed");

  const user = await prisma.user.upsert({ where: { phone: "+910000000001" }, update: {}, create: { phone: "+910000000001" } });
  const order = await createOrderFromHold(hold.holdToken, user.id);
  if (!order) throw new Error("order failed");
  await fulfillOrder(order.id);

  const invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
  const refund = await refundOrder(order.id, { isAdmin: true, actorId: "test" });

  const o = await prisma.order.findUnique({ where: { id: order.id }, include: { tickets: true } });
  const refundedTickets = o!.tickets.filter((t) => t.state === "refunded").length;

  // seats should be free again — re-hold must succeed
  const rehold = await createHolds(st.id, seats.map((s) => s.id));

  console.log(`invoice=${invoice?.number} refundAmount=${refund.amount} order=${o!.status} refundedTickets=${refundedTickets} reholdOk=${rehold.ok}`);
  const pass = !!invoice && o!.status === "refunded" && refundedTickets === 2 && rehold.ok;
  console.log(pass ? "✅ PASS — refund frees seats + invoice generated" : "❌ FAIL");

  // cleanup
  if (rehold.ok) await prisma.ticket.deleteMany({ where: { holdToken: rehold.holdToken } });
  await prisma.refund.deleteMany({ where: { orderId: order.id } });
  await prisma.invoice.deleteMany({ where: { orderId: order.id } });
  await prisma.ticket.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  if (!pass) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
