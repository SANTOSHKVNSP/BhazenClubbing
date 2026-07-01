/** Proof: GA never oversells under concurrency + counter releases cleanly (ADR-020). */
import { prisma } from "../lib/db";
import { reserveTickets, releaseHold } from "../lib/booking/holds";

async function main() {
  const st = await prisma.showtime.findFirst();
  if (!st) throw new Error("seed first");

  // Fresh GA category with capacity 5
  const prior = await prisma.ticketCategory.findFirst({ where: { eventId: st.eventId, name: "GA-Test" } });
  if (prior) {
    await prisma.ticket.deleteMany({ where: { ticketCategoryId: prior.id } });
    await prisma.gaInventory.deleteMany({ where: { ticketCategoryId: prior.id } });
    await prisma.ticketCategory.delete({ where: { id: prior.id } });
  }
  const cat = await prisma.ticketCategory.create({ data: { eventId: st.eventId, name: "GA-Test", admission: "general", capacity: 5, basePrice: 50000 } });
  await prisma.gaInventory.create({ data: { showtimeId: st.id, ticketCategoryId: cat.id, capacity: 5, reserved: 0 } });

  // 12 concurrent buyers, 1 GA ticket each, capacity 5
  const results = await Promise.all(
    Array.from({ length: 12 }, () => reserveTickets(st.id, { ga: [{ categoryId: cat.id, qty: 1 }] }))
  );
  const ok = results.filter((r) => r.ok).length;
  const soldOut = results.filter((r) => !r.ok).length;
  const invKey = { showtimeId_ticketCategoryId: { showtimeId: st.id, ticketCategoryId: cat.id } };
  const inv = await prisma.gaInventory.findUnique({ where: invKey });
  const held = await prisma.ticket.count({ where: { ticketCategoryId: cat.id, state: "held" } });
  console.log(`GA cap=5, 12 concurrent: ok=${ok} soldOut=${soldOut} reserved=${inv?.reserved} heldTickets=${held}`);
  const pass1 = ok === 5 && soldOut === 7 && inv?.reserved === 5 && held === 5;
  console.log(pass1 ? "✅ no oversell (exactly capacity)" : "❌ OVERSELL / MISMATCH");

  // Release the winners → counter returns to 0
  for (const r of results) if (r.ok) await releaseHold(r.holdToken);
  const inv2 = await prisma.gaInventory.findUnique({ where: invKey });
  const held2 = await prisma.ticket.count({ where: { ticketCategoryId: cat.id, state: "held" } });
  console.log(`after release: reserved=${inv2?.reserved} held=${held2}`);
  const pass2 = inv2?.reserved === 0 && held2 === 0;
  console.log(pass2 ? "✅ release decrements counter (no drift)" : "❌ counter drift");

  await prisma.gaInventory.deleteMany({ where: { ticketCategoryId: cat.id } });
  await prisma.ticketCategory.delete({ where: { id: cat.id } });
  await prisma.$disconnect();
  if (!(pass1 && pass2)) process.exitCode = 1;
}
main();
