import { type SeatMap, type SeatRow, rowLabel } from "./types";

// Theatre: one section, rows A.. front-to-back; tiers assign categories by row band.
export function generateTheatre(opts: {
  rows: number;
  seatsPerRow: number;
  tiers: { category: string; rows: number }[]; // front-to-back; should sum to `rows`
  sectionId?: string;
  sectionLabel?: string;
}): SeatMap {
  const rowCategory: string[] = [];
  for (const t of opts.tiers) for (let i = 0; i < t.rows; i++) rowCategory.push(t.category);
  const fallback = opts.tiers[opts.tiers.length - 1]?.category ?? "GA";

  const rows: SeatRow[] = [];
  for (let r = 0; r < opts.rows; r++) {
    const category = rowCategory[r] ?? fallback;
    rows.push({
      label: rowLabel(r),
      seats: Array.from({ length: opts.seatsPerRow }, (_, s) => ({
        number: String(s + 1),
        category,
      })),
    });
  }
  return {
    template: "theatre",
    sections: [{ id: opts.sectionId ?? "main", label: opts.sectionLabel ?? "Auditorium", rows }],
  };
}

// Stadium: multiple blocks, each a section with its own rows + single category.
export function generateStadium(opts: {
  sections: { id: string; label: string; rows: number; seatsPerRow: number; category: string }[];
}): SeatMap {
  return {
    template: "stadium",
    sections: opts.sections.map((sp) => ({
      id: sp.id,
      label: sp.label,
      rows: Array.from({ length: sp.rows }, (_, r) => ({
        label: rowLabel(r),
        seats: Array.from({ length: sp.seatsPerRow }, (_, s) => ({
          number: String(s + 1),
          category: sp.category,
        })),
      })),
    })),
  };
}
