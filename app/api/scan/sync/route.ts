import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, publicKeyB64 } from "@/lib/tickets/qr";

// Scanner gate (TEMPORARY token; Phase 5 replaces with the Scanner RBAC role).
function authed(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? req.headers.get("x-scanner-token");
  return !!token && token === (process.env.SCANNER_TOKEN ?? "scan");
}

// Pre-sync allowlist for a showtime: the scanner validates fully offline against this.
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const showtimeId = req.nextUrl.searchParams.get("showtimeId");
  if (!showtimeId) return NextResponse.json({ error: "showtimeId required" }, { status: 400 });

  const showtime = await prisma.showtime.findUnique({ where: { id: showtimeId }, include: { event: true } });
  if (!showtime) return NextResponse.json({ error: "showtime not found" }, { status: 404 });

  const tickets = await prisma.ticket.findMany({
    where: { showtimeId, state: { in: ["sold", "comp"] }, qrToken: { not: null } },
    include: { seat: true },
  });

  const allowlist = tickets.map((t) => ({
    ticketId: t.id,
    qrHash: hashToken(t.qrToken!),
    seat: `${t.seat.row}${t.seat.number}`,
    category: t.category,
    checkedIn: t.checkinStatus === "used",
  }));

  return NextResponse.json({
    showtimeId,
    event: showtime.event.title,
    startsAt: showtime.startsAt,
    publicKey: publicKeyB64(),
    version: Date.now(),
    count: allowlist.length,
    allowlist,
  });
}
