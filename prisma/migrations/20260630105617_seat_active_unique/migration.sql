-- Concurrency guard (ADR-009): a seat can be HELD or SOLD at most once per showtime.
-- This is a PARTIAL unique index, which Prisma cannot express in schema.prisma,
-- so it is defined here as raw SQL. Refunded/expired tickets are excluded, so a
-- released seat becomes sellable again.
CREATE UNIQUE INDEX "ticket_active_seat_unique"
  ON "Ticket" ("showtimeId", "seatId")
  WHERE "state" IN ('held', 'sold');
