/**
 * Money-path proof: hold → order → fulfill → seats SOLD, idempotent.
 * Run: npx tsx scripts/checkout-test.ts
 */
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";
import { createOrderFromHold, fulfillOrder } from "../lib/booking/checkout";

async function main() {
  const st = await prisma.showtime.findFirst();
  if (!st) throw new Error("seed first");
  await prisma.ticket.deleteMany({ where: { showtimeId: st.id, state: "held" } });

  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id }, take: 2 });
  const hold = await createHolds(st.id, seats.map((s) => s.id));
  if (!hold.ok) throw new Error("hold failed");

  const user = await prisma.user.upsert({
    where: { phone: "+910000000000" },
    update: {},
    create: { phone: "+910000000000" },
  });

  const order = await createOrderFromHold(hold.holdToken, user.id);
  if (!order) throw new Error("order creation failed");

  await fulfillOrder(order.id);
  const o = await prisma.order.findUnique({ where: { id: order.id }, include: { tickets: true } });
  const sold = o!.tickets.filter((t) => t.state === "sold").length;
  console.log(`order status=${o!.status} total=${o!.total} soldTickets=${sold} (expect paid, total>0, 2)`);

  // idempotency: fulfilling again must not error or change state
  await fulfillOrder(order.id);
  const o2 = await prisma.order.findUnique({ where: { id: order.id } });
  console.log(`re-fulfill status=${o2!.status} (expect still paid)`);

  const pass = o!.status === "paid" && sold === 2 && o!.total > 0 && o2!.status === "paid";
  console.log(pass ? "✅ PASS — money path works (idempotent)" : "❌ FAIL");

  // cleanup
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
