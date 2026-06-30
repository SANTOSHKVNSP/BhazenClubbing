import QRCode from "qrcode";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/ticket/${ticketId}`)}`);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { seat: true, order: true, showtime: { include: { event: { include: { city: true, venue: true } } } } },
  });
  if (!ticket || ticket.order?.userId !== session.user.id) notFound();

  const event = ticket.showtime.event;
  const active = (ticket.state === "sold" || ticket.state === "comp") && !!ticket.qrToken;
  const qr = active ? await QRCode.toDataURL(ticket.qrToken!, { width: 320, margin: 1, color: { dark: "#1d0541", light: "#ffffff" } }) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-purple-deep px-6 py-12">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-primary to-purple-deep p-6 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{event.city.name}</p>
          <h1 className="mt-1 font-display text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-sm text-white/80">{fmt(ticket.showtime.startsAt)}</p>
        </div>
        <div className="p-6 text-center">
          {qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Ticket QR" className="mx-auto h-64 w-64" />
              <p className="mt-4 font-display text-3xl font-extrabold text-ink">Seat {ticket.seat.row}{ticket.seat.number}</p>
              <p className="text-sm text-muted">{ticket.category} · {event.venue?.name}</p>
              <p className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${ticket.checkinStatus === "used" ? "bg-neutral-200 text-neutral-500" : "bg-green-100 text-green-700"}`}>
                {ticket.checkinStatus === "used" ? "Already checked in" : "Valid · show at gate"}
              </p>
            </>
          ) : (
            <p className="py-10 text-muted">This ticket isn&apos;t active{ticket.state === "refunded" ? " (refunded)" : ""}.</p>
          )}
        </div>
      </div>
    </main>
  );
}
