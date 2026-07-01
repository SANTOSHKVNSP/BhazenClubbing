import { prisma } from "@/lib/db";
import { releaseExpiredHolds, MAX_SEATS_PER_HOLD } from "@/lib/booking/holds";

export type SeatStatus = "available" | "held" | "sold" | "blocked";
export type UISeat = {
  id: string;
  row: string;
  number: string;
  category: string;
  status: SeatStatus;
  accessible: boolean;
};
export type UICategory = { name: string; color: string | null; price: number };
export type UIGa = {
  categoryId: string;
  name: string;
  color: string | null;
  price: number;
  available: number;
  maxPerOrder: number;
};
export type ShowtimeSeating = {
  showtimeId: string;
  sections: { id: string; label: string; rows: { label: string; seats: UISeat[] }[] }[];
  categories: UICategory[];
  ga: UIGa[];
  available: number;
};

export async function getShowtimeSeating(showtimeId: string): Promise<ShowtimeSeating | null> {
  await releaseExpiredHolds(); // lazy cleanup so availability is accurate

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { event: { include: { categories: true, venue: true } } },
  });
  if (!showtime) return null;

  // --- Reserved seats ---
  const seats = await prisma.seat.findMany({ where: { showtimeId } });
  const active = await prisma.ticket.findMany({
    where: {
      showtimeId,
      seatId: { not: null },
      OR: [{ state: "sold" }, { state: "comp" }, { state: "held", expiresAt: { gt: new Date() } }],
    },
    select: { seatId: true, state: true },
  });
  const taken = new Map<string, "held" | "sold">();
  for (const t of active) if (t.seatId) taken.set(t.seatId, t.state === "held" ? "held" : "sold");

  const layout = showtime.event.venue?.layoutJson as { sections?: { id: string; label: string }[] } | null;
  const sectionLabel = new Map((layout?.sections ?? []).map((s) => [s.id, s.label]));

  const bySection = new Map<string, Map<string, UISeat[]>>();
  let available = 0;
  for (const s of seats) {
    const status: SeatStatus = s.blocked ? "blocked" : taken.get(s.id) ?? "available";
    if (status === "available") available++;
    const ui: UISeat = { id: s.id, row: s.row, number: s.number, category: s.category, status, accessible: s.accessible };
    if (!bySection.has(s.section)) bySection.set(s.section, new Map());
    const rows = bySection.get(s.section)!;
    if (!rows.has(s.row)) rows.set(s.row, []);
    rows.get(s.row)!.push(ui);
  }

  const sections = [...bySection.entries()].map(([id, rowsMap]) => ({
    id,
    label: sectionLabel.get(id) ?? id,
    rows: [...rowsMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, arr]) => ({ label, seats: arr.sort((a, b) => parseInt(a.number) - parseInt(b.number)) })),
  }));

  const categories: UICategory[] = showtime.event.categories
    .filter((c) => c.admission === "reserved")
    .map((c) => ({ name: c.name, color: c.color, price: c.basePrice }))
    .sort((a, b) => b.price - a.price);

  // --- General admission ---
  const generalCats = showtime.event.categories.filter((c) => c.admission === "general");
  const inv = generalCats.length ? await prisma.gaInventory.findMany({ where: { showtimeId } }) : [];
  const invByCat = new Map(inv.map((i) => [i.ticketCategoryId, i]));
  const ga: UIGa[] = generalCats
    .map((c) => {
      const row = invByCat.get(c.id);
      const avail = row ? Math.max(0, row.capacity - row.reserved) : 0;
      available += avail;
      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        price: c.basePrice,
        available: avail,
        maxPerOrder: Math.min(c.maxPerOrder ?? MAX_SEATS_PER_HOLD, MAX_SEATS_PER_HOLD),
      };
    })
    .sort((a, b) => b.price - a.price);

  if (sections.length === 0 && ga.length === 0) return null;
  return { showtimeId, sections, categories, ga, available };
}
