import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { payDev, applyPromo } from "@/lib/booking/checkout-actions";
import { razorpayConfigured } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ promo?: string }> }) {
  const { orderId } = await params;
  const { promo: promoFlag } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${orderId}`)}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: { include: { seat: true } }, showtime: { include: { event: true } } },
  });
  if (!order || order.userId !== session.user.id) notFound();
  if (order.status === "paid") redirect(`/checkout/${orderId}/confirmed`);

  const event = order.showtime.event;
  const seats = order.tickets
    .map((t) => ({ label: `${t.seat.row}${t.seat.number}`, category: t.category, price: t.price }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-purple-deep px-6 py-16">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-2">{event.title}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Checkout</h1>

        <ul className="mt-6 divide-y divide-black/10">
          {seats.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-semibold text-ink">Seat {s.label} <span className="font-normal text-muted">· {s.category}</span></span>
              <span className="text-ink">₹{rupees(s.price)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>₹{rupees(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>−₹{rupees(order.discount)}</dd></div>}
          {order.fee > 0 && <div className="flex justify-between"><dt className="text-muted">Convenience fee</dt><dd>₹{rupees(order.fee)}</dd></div>}
          {order.gst > 0 && <div className="flex justify-between"><dt className="text-muted">GST</dt><dd>₹{rupees(order.gst)}</dd></div>}
          <div className="flex justify-between border-t border-black/10 pt-2 font-display text-xl font-extrabold text-ink"><dt>Total</dt><dd>₹{rupees(order.total)}</dd></div>
        </dl>

        {!order.promoId && (
          <form action={applyPromo} className="mt-5 flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <input name="code" placeholder="Promo code" className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm uppercase" />
            <button className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Apply</button>
          </form>
        )}
        {promoFlag === "applied" && <p className="mt-2 text-xs font-semibold text-green-700">Promo applied!</p>}
        {promoFlag === "invalid" && <p className="mt-2 text-xs font-semibold text-red-600">Invalid or expired code.</p>}

        {razorpayConfigured() ? (
          // When keys are set, render the Razorpay Checkout widget here (client) using a
          // server-created order id. Wired in the keys-provided step.
          <p className="mt-6 rounded-lg bg-orange/10 p-4 text-center text-sm text-orange-2">
            Razorpay is configured — checkout widget loads here.
          </p>
        ) : (
          <form action={payDev} className="mt-6">
            <input type="hidden" name="orderId" value={order.id} />
            <button className="w-full rounded-full bg-gradient-to-br from-orange to-orange-2 px-8 py-3.5 font-bold text-white">
              Pay ₹{rupees(order.total)} — simulate success (dev)
            </button>
          </form>
        )}
        <p className="mt-3 text-center text-xs text-muted">
          Dev mode: no real charge. Razorpay activates automatically when API keys are set.
        </p>
      </div>
    </main>
  );
}
