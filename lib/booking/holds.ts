import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export const HOLD_MINUTES = 8;
export const MAX_SEATS_PER_HOLD = 10;

// Release expired holds so their inventory frees up (ADR-009/020). For GA holds
// we decrement the GaInventory counter before deleting the seatless tickets.
export async function releaseExpiredHolds(): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const ga = await tx.ticket.groupBy({
      by: ["showtimeId", "ticketCategoryId"],
      where: { state: "held", expiresAt: { lt: now }, ticketCategoryId: { not: null } },
      _count: { _all: true },
    });
    for (const g of ga) {
      await tx.$executeRaw`UPDATE "GaInventory" SET reserved = GREATEST(reserved - ${g._count._all}, 0) WHERE "showtimeId" = ${g.showtimeId} AND "ticketCategoryId" = ${g.ticketCategoryId}`;
    }
    await tx.ticket.deleteMany({ where: { state: "held", expiresAt: { lt: now } } });
  });
}

export type HoldResult =
  | { ok: true; holdToken: string; expiresAt: Date; count: number }
  | { ok: false; taken: string[]; soldOut?: string };

export type ReserveInput = { seatIds?: string[]; ga?: { categoryId: string; qty: number }[] };

// Atomically hold reserved seats and/or GA quantities under one holdToken.
// Reserved: partial unique index (showtimeId,seatId) prevents double-sell.
// GA: atomic `UPDATE … WHERE reserved+qty<=capacity` prevents oversell (ADR-020).
// Any failure rolls back the whole hold (ADR-021).
export async function reserveTickets(showtimeId: string, input: ReserveInput): Promise<HoldResult> {
  const seatIds = [...new Set(input.seatIds ?? [])];
  const ga = (input.ga ?? []).filter((g) => g.qty > 0);
  const totalGa = ga.reduce((s, g) => s + g.qty, 0);
  if (seatIds.length === 0 && totalGa === 0) return { ok: false, taken: [] };
  if (seatIds.length + totalGa > MAX_SEATS_PER_HOLD) {
    throw new Error(`You can hold at most ${MAX_SEATS_PER_HOLD} tickets at once.`);
  }

  await releaseExpiredHolds();

  const holdToken = randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
  const now = new Date();

  let seats: { id: string; category: string }[] = [];
  if (seatIds.length) {
    seats = await prisma.seat.findMany({ where: { id: { in: seatIds }, showtimeId, blocked: false } });
    if (seats.length !== seatIds.length) return { ok: false, taken: seatIds };
  }

  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { event: { include: { categories: true } } },
  });
  const catByName = new Map((showtime?.event.categories ?? []).map((c) => [c.name, c]));
  const catById = new Map((showtime?.event.categories ?? []).map((c) => [c.id, c]));
  for (const g of ga) {
    const c = catById.get(g.categoryId);
    if (!c || c.admission !== "general") return { ok: false, taken: [], soldOut: c?.name ?? "unknown" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (seats.length) {
        const values = seats.map(
          (s) => Prisma.sql`(${randomUUID()}, ${showtimeId}, ${s.id}, ${s.category}, ${
            catByName.get(s.category)?.basePrice ?? 0
          }, 'held'::"TicketState", ${holdToken}, ${expiresAt}, ${now})`
        );
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
          throw err;
        }
      }
      for (const g of ga) {
        const cat = catById.get(g.categoryId)!;
        const updated = await tx.$executeRaw`UPDATE "GaInventory" SET reserved = reserved + ${g.qty} WHERE "showtimeId" = ${showtimeId} AND "ticketCategoryId" = ${g.categoryId} AND reserved + ${g.qty} <= capacity`;
        if (updated !== 1) {
          const e = new Error("GA_SOLD_OUT") as Error & { soldOut: string };
          e.soldOut = cat.name;
          throw e;
        }
        for (let i = 0; i < g.qty; i++) {
          await tx.ticket.create({
            data: { showtimeId, ticketCategoryId: g.categoryId, category: cat.name, price: cat.basePrice, state: "held", holdToken, expiresAt },
          });
        }
      }
    });
    return { ok: true, holdToken, expiresAt, count: seats.length + totalGa };
  } catch (e) {
    const taken = (e as { taken?: string[] }).taken;
    if (taken) return { ok: false, taken };
    const soldOut = (e as { soldOut?: string }).soldOut;
    if (soldOut) return { ok: false, taken: [], soldOut };
    throw e;
  }
}

// Back-compat: reserved-seats-only hold.
export const createHolds = (showtimeId: string, seatIds: string[]) => reserveTickets(showtimeId, { seatIds });

export async function releaseHold(holdToken: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ga = await tx.ticket.groupBy({
      by: ["showtimeId", "ticketCategoryId"],
      where: { holdToken, state: "held", ticketCategoryId: { not: null } },
      _count: { _all: true },
    });
    for (const g of ga) {
      await tx.$executeRaw`UPDATE "GaInventory" SET reserved = GREATEST(reserved - ${g._count._all}, 0) WHERE "showtimeId" = ${g.showtimeId} AND "ticketCategoryId" = ${g.ticketCategoryId}`;
    }
    await tx.ticket.deleteMany({ where: { holdToken, state: "held" } });
  });
}

export async function getHold(holdToken: string) {
  await releaseExpiredHolds();
  return prisma.ticket.findMany({
    where: { holdToken, state: "held" },
    include: {
      seat: true,
      ticketCategory: true,
      showtime: { include: { event: { include: { city: true, venue: true } } } },
    },
  });
}
