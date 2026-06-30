import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export const HOLD_MINUTES = 8;
export const MAX_SEATS_PER_HOLD = 10;

// Delete expired holds so their seats become available again (ADR-009).
export async function releaseExpiredHolds(): Promise<void> {
  await prisma.ticket.deleteMany({
    where: { state: "held", expiresAt: { lt: new Date() } },
  });
}

export type HoldResult =
  | { ok: true; holdToken: string; expiresAt: Date; count: number }
  | { ok: false; taken: string[] };

// Atomically hold seats. Relies on the partial unique index
// UNIQUE (showtimeId, seatId) WHERE state IN ('held','sold') to prevent double-sell.
export async function createHolds(showtimeId: string, seatIds: string[]): Promise<HoldResult> {
  const unique = [...new Set(seatIds)];
  if (unique.length === 0) return { ok: false, taken: [] };
  if (unique.length > MAX_SEATS_PER_HOLD) {
    throw new Error(`You can hold at most ${MAX_SEATS_PER_HOLD} seats at once.`);
  }

  await releaseExpiredHolds();

  const seats = await prisma.seat.findMany({
    where: { id: { in: unique }, showtimeId, blocked: false },
  });
  if (seats.length !== unique.length) return { ok: false, taken: unique };

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { event: { include: { categories: true } } },
  });
  const priceByCat = new Map((showtime?.event.categories ?? []).map((c) => [c.name, c.basePrice]));

  const holdToken = randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
  const now = new Date();

  const values = seats.map(
    (s) =>
      Prisma.sql`(${randomUUID()}, ${showtimeId}, ${s.id}, ${s.category}, ${
        priceByCat.get(s.category) ?? 0
      }, 'held'::"TicketState", ${holdToken}, ${expiresAt}, ${now})`
  );

  try {
    const inserted = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ seatId: string }[]>(Prisma.sql`
        INSERT INTO "Ticket" ("id","showtimeId","seatId","category","price","state","holdToken","expiresAt","createdAt")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("showtimeId","seatId") WHERE "state" IN ('held','sold') DO NOTHING
        RETURNING "seatId"
      `);
      if (rows.length !== seats.length) {
        const got = new Set(rows.map((r) => r.seatId));
        const err = new Error("HOLD_CONFLICT") as Error & { taken: string[] };
        err.taken = seats.filter((s) => !got.has(s.id)).map((s) => s.id);
        throw err; // rolls back any partial inserts
      }
      return rows;
    });
    return { ok: true, holdToken, expiresAt, count: inserted.length };
  } catch (e) {
    const taken = (e as { taken?: string[] }).taken;
    if (taken) return { ok: false, taken };
    throw e;
  }
}

export async function releaseHold(holdToken: string): Promise<void> {
  await prisma.ticket.deleteMany({ where: { holdToken, state: "held" } });
}

export async function getHold(holdToken: string) {
  await releaseExpiredHolds();
  return prisma.ticket.findMany({
    where: { holdToken, state: "held" },
    include: {
      seat: true,
      showtime: { include: { event: { include: { city: true, venue: true } } } },
    },
  });
}
