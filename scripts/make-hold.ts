// Dev helper: create a hold and print its token (for screenshotting the hold page).
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";

async function main() {
  await prisma.ticket.deleteMany({ where: { state: "held" } });
  const st = await prisma.showtime.findFirst();
  if (!st) throw new Error("no showtime");
  const seats = await prisma.seat.findMany({ where: { showtimeId: st.id }, take: 3 });
  const r = await createHolds(st.id, seats.map((s) => s.id));
  console.log(r.ok ? `HOLDTOKEN=${r.holdToken}` : "FAIL");
}
main().then(() => prisma.$disconnect());
