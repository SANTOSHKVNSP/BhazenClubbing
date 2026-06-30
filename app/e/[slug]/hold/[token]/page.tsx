import Link from "next/link";
import { getHold } from "@/lib/booking/holds";
import { releaseHoldAction } from "@/lib/booking/actions";
import { HoldTimer } from "@/components/booking/hold-timer";

export const dynamic = "force-dynamic";

const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function HoldPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const tickets = await getHold(token);

  if (tickets.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-purple-deep px-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Your hold has expired</h1>
          <p className="mt-3 text-white/70">Seats are released after a few minutes. Please pick again.</p>
          <Link href={`/e/${slug}/seats`} className="mt-8 inline-flex rounded-full bg-gradient-to-br from-orange to-orange-2 px-8 py-3 font-bold text-white">
            Pick seats again →
          </Link>
        </div>
      </main>
    );
  }

  const event = tickets[0].showtime.event;
  const expiresAt = (tickets[0].expiresAt ?? new Date()).toISOString();
  const total = tickets.reduce((s, t) => s + t.price, 0);
  const seats = tickets
    .map((t) => ({ label: `${t.seat.row}${t.seat.number}`, category: t.category, price: t.price }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-purple-deep px-6 py-16">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-2">{event.title}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Seats on hold</h1>
        <p className="mt-2 text-sm text-muted">
          Held for <span className="font-bold text-ink"><HoldTimer expiresAt={expiresAt} /></span> — finish checkout before the timer runs out.
        </p>

        <ul className="mt-6 divide-y divide-black/10">
          {seats.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold text-ink">Seat {s.label} <span className="font-normal text-muted">· {s.category}</span></span>
              <span className="font-semibold text-ink">₹{rupees(s.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
          <span className="font-display text-lg font-bold text-ink">Total</span>
          <span className="font-display text-2xl font-extrabold text-ink">₹{rupees(total)}</span>
        </div>

        <button
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-full bg-gradient-to-br from-orange to-orange-2 px-8 py-3.5 font-bold text-white opacity-60"
          title="Razorpay checkout arrives in Phase 3"
        >
          Proceed to payment (opens in Phase 3)
        </button>

        <form action={releaseHoldAction} className="mt-3 text-center">
          <input type="hidden" name="holdToken" value={token} />
          <input type="hidden" name="slug" value={slug} />
          <button className="text-sm text-muted hover:text-ink hover:underline">Release &amp; start over</button>
        </form>
      </div>
    </main>
  );
}
