import { prisma } from "../db";
import type { SeatMap } from "./types";

// Materialize Seat rows for a showtime from its venue's layoutJson.
// Refuses if any tickets already reference this showtime's seats.
export async function materializeSeats(showtimeId: string): Promise<number> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { event: { include: { venue: true } } },
  });
  if (!showtime) throw new Error("Showtime not found");
  const venue = showtime.event.venue;
  if (!venue) throw new Error("Event has no venue");

  const map = venue.layoutJson as unknown as SeatMap;
  if (!map?.sections?.length) throw new Error("Venue has no seat map");

  const ticketCount = await prisma.ticket.count({ where: { showtimeId } });
  if (ticketCount > 0) throw new Error("Seats already held/sold — cannot regenerate");

  await prisma.seat.deleteMany({ where: { showtimeId } });

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
  return rows.length;
}
