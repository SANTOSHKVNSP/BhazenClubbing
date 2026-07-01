import { prisma } from "../db";
import type { SeatMap } from "./types";

// Materialize inventory for a showtime: Seat rows for reserved categories (from the
// venue layout) + a GaInventory row per general category (ADR-019/020).
// Refuses if any tickets already reference this showtime.
export async function materializeSeats(showtimeId: string): Promise<{ seats: number; ga: number }> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { event: { include: { venue: true, categories: true } } },
  });
  if (!showtime) throw new Error("Showtime not found");

  const ticketCount = await prisma.ticket.count({ where: { showtimeId } });
  if (ticketCount > 0) throw new Error("Tickets already held/sold — cannot regenerate");

  const cats = showtime.event.categories;
  const generalCats = cats.filter((c) => c.admission === "general");
  const hasReserved = cats.some((c) => c.admission === "reserved");

  // --- Reserved seats from the venue layout ---
  await prisma.seat.deleteMany({ where: { showtimeId } });
  let seatCount = 0;
  const map = showtime.event.venue?.layoutJson as unknown as SeatMap | undefined;
  if (map?.sections?.length) {
    const rows = map.sections.flatMap((sec) =>
      sec.rows.flatMap((row) =>
        row.seats.map((cell) => ({
          showtimeId,
          section: sec.id,
          row: row.label,
          number: cell.number,
          category: cell.category,
          accessible: !!cell.accessible,
          blocked: !!cell.blocked,
        }))
      )
    );
    for (let i = 0; i < rows.length; i += 1000) {
      await prisma.seat.createMany({ data: rows.slice(i, i + 1000) });
    }
    seatCount = rows.length;
  } else if (hasReserved) {
    throw new Error("Venue has no seat map (required for reserved categories)");
  }

  // --- GA inventory for general categories ---
  await prisma.gaInventory.deleteMany({ where: { showtimeId } });
  for (const c of generalCats) {
    await prisma.gaInventory.create({
      data: { showtimeId, ticketCategoryId: c.id, capacity: c.capacity ?? 0, reserved: 0 },
    });
  }

  return { seats: seatCount, ga: generalCats.length };
}
