import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function authed(req: NextRequest) {
  const token = req.headers.get("x-scanner-token");
  return !!token && token === (process.env.SCANNER_TOKEN ?? "scan");
}

type Checkin = { ticketId: string; scannedAt: number; deviceId: string };

// Sync queued offline check-ins. First sync admits; cross-device duplicates are
// flagged (not admitted). Idempotent per (ticket, device, scannedAt) on re-sync.
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { checkins } = (await req.json()) as { checkins?: Checkin[] };
  const results: { ticketId: string; result: string }[] = [];

  for (const c of checkins ?? []) {
    const scannedAt = new Date(c.scannedAt);

    const already = await prisma.checkinEvent.findFirst({
      where: { ticketId: c.ticketId, deviceId: c.deviceId, scannedAt },
    });
    if (already) {
      results.push({ ticketId: c.ticketId, result: "resync" });
      continue;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: c.ticketId } });
    if (!ticket || (ticket.state !== "sold" && ticket.state !== "comp")) {
      await prisma.checkinEvent.create({
        data: { ticketId: c.ticketId, showtimeId: ticket?.showtimeId ?? "", deviceId: c.deviceId, scannedAt, source: "offline_sync", flagged: true, flagReason: "invalid ticket" },
      });
      results.push({ ticketId: c.ticketId, result: "invalid" });
      continue;
    }

    if (ticket.checkinStatus === "used") {
      await prisma.checkinEvent.create({
        data: { ticketId: c.ticketId, showtimeId: ticket.showtimeId, deviceId: c.deviceId, scannedAt, source: "offline_sync", flagged: true, flagReason: "duplicate" },
      });
      results.push({ ticketId: c.ticketId, result: "duplicate" });
      continue;
    }

    await prisma.$transaction([
      prisma.ticket.update({ where: { id: c.ticketId }, data: { checkinStatus: "used", checkinAt: scannedAt } }),
      prisma.checkinEvent.create({ data: { ticketId: c.ticketId, showtimeId: ticket.showtimeId, deviceId: c.deviceId, scannedAt, source: "offline_sync", flagged: false } }),
    ]);
    results.push({ ticketId: c.ticketId, result: "admitted" });
  }

  return NextResponse.json({ ok: true, results });
}
