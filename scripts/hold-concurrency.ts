/**
 * Concurrency proof for the seat-hold service (ADR-009, QA TS-HOLD/TS-PERF-02).
 * Hammers the same seats with N simultaneous holds; the partial unique index
 * must let exactly ONE win — never a double-book. Run: npx tsx scripts/hold-concurrency.ts
 */
import { prisma } from "../lib/db";
import { createHolds } from "../lib/booking/holds";

const N = 25;

async function main() {
  const showtime = await prisma.showtime.findFirst();
  if (!showtime) throw new Error("No showtime — seed first.");

  // clean slate
  await prisma.ticket.deleteMany({ where: { showtimeId: showtime.id, state: "held" } });

  const seats = await prisma.seat.findMany({ where: { showtimeId: showtime.id }, take: 3 });
  const pair = [seats[0].id, seats[1].id];
  const single = seats[2].id;

  // Test 1: N concurrent holds on the SAME pair of seats
  const r1 = await Promise.all(Array.from({ length: N }, () => createHolds(showtime.id, pair)));
  const ok1 = r1.filter((r) => r.ok).length;
  const held1 = await prisma.ticket.count({ where: { seatId: { in: pair }, state: "held" } });
  console.log(`PAIR  : N=${N} winners=${ok1} (expect 1) | heldRowsForSeats=${held1} (expect 2)`);

  // Test 2: N concurrent holds on a SINGLE seat
  const r2 = await Promise.all(Array.from({ length: N }, () => createHolds(showtime.id, [single])));
  const ok2 = r2.filter((r) => r.ok).length;
  const held2 = await prisma.ticket.count({ where: { seatId: single, state: "held" } });
  console.log(`SINGLE: N=${N} winners=${ok2} (expect 1) | heldRowsForSeat=${held2} (expect 1)`);

  const pass = ok1 === 1 && held1 === 2 && ok2 === 1 && held2 === 1;
  console.log(pass ? "✅ PASS — no double-book under concurrency" : "❌ FAIL — double-book detected!");

  // cleanup
  await prisma.ticket.deleteMany({ where: { showtimeId: showtime.id, state: "held" } });
  if (!pass) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
