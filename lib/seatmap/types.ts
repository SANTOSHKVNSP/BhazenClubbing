// Seat-map JSON stored on Venue.layoutJson (ADR-002, ADR-013).
// `category` values match TicketCategory.name for an event (price tiers).

export type SeatCell = {
  number: string;
  category: string;
  accessible?: boolean;
  blocked?: boolean;
};

export type SeatRow = {
  label: string; // e.g. "A"
  seats: SeatCell[];
};

export type SeatSection = {
  id: string; // stable key, e.g. "main", "north"
  label: string; // human label, e.g. "Auditorium"
  rows: SeatRow[];
};

export type SeatMap = {
  template: "theatre" | "stadium";
  sections: SeatSection[];
};

export function rowLabel(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i);
  const a = Math.floor(i / 26) - 1;
  const b = i % 26;
  return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
}

export function countSeats(map: SeatMap): number {
  return map.sections.reduce(
    (n, s) => n + s.rows.reduce((m, r) => m + r.seats.length, 0),
    0
  );
}
