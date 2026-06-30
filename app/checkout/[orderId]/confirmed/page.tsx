import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function ConfirmedPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${orderId}/confirmed`)}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: { include: { seat: true } }, showtime: { include: { event: true } } },
  });
  if (!order || order.userId !== session.user.id) notFound();

  const event = order.showtime.event;
  const seats = order.tickets
    .map((t) => `${t.seat.row}${t.seat.number}`)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-purple-deep px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</div>
        <h1 className="mt-5 font-display text-3xl font-bold text-ink">Booking confirmed!</h1>
        <p className="mt-2 text-muted">{event.title}</p>
        <p className="mt-4 text-sm text-ink">
          Seats: <span className="font-semibold">{seats.join(", ")}</span>
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold text-ink">₹{rupees(order.total)} paid</p>
        <p className="mt-5 rounded-lg bg-cream p-3 text-xs text-muted">
          Your ticket &amp; QR code will be emailed and sent on WhatsApp (Phase 4). A GST invoice is generated for paid orders.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-2.5 text-sm font-bold text-white">My bookings</Link>
          <Link href="/" className="rounded-full border-2 border-black/15 px-6 py-2.5 text-sm font-bold text-ink">Home</Link>
        </div>
      </div>
    </main>
  );
}
