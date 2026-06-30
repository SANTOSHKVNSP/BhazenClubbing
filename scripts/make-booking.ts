// Dev helper: create one paid (sold) ticket and print its ids/token for scanner tests.
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";
import { createOrderFromHold, fulfillOrder } from "../lib/booking/checkout";

async function main() {
  const st = await prisma.showtime.findFirst();
  if (!st) throw new Error("seed first");
  await prisma.ticket.deleteMany({ where: { showtimeId: st.id, state: "held" } });
  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id }, take: 1 });
  const hold = await createHolds(st.id, [seats[0].id]);
  if (!hold.ok) throw new Error("hold failed");
  const user = await prisma.user.upsert({ where: { phone: "+910000000002" }, update: {}, create: { phone: "+910000000002" } });
  const order = await createOrderFromHold(hold.holdToken, user.id);
  await fulfillOrder(order!.id);
  const t = await prisma.ticket.findFirst({ where: { orderId: order!.id } });
  console.log(`SHOWTIME=${st.id}`);
  console.log(`ORDER=${order!.id}`);
  console.log(`TICKET=${t!.id}`);
  console.log(`TOKEN=${t!.qrToken}`);
  await prisma.$disconnect();
}
main();
