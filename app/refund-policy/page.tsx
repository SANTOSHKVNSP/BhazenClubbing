import Link from "next/link";

export const metadata = { title: "Refund & Cancellation Policy — Sattvik Beats" };

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 text-ink">
        <Link href="/" className="text-sm font-semibold text-orange-2 hover:underline">← Home</Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-muted">Sattvik Beats (Art of Living) · <span className="italic">Draft — pending legal review</span></p>
        <div className="mt-8 space-y-3 text-[15px] leading-relaxed text-ink/80">
          <h2 className="pt-4 font-display text-xl font-bold text-ink">Per-event policy</h2>
          <p>Each event sets its own refund policy, shown at checkout and on your booking. It may be non-refundable, self-service (within a stated window, possibly minus a fee), or refundable on request to the organiser.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">How refunds are made</h2>
          <p>Approved refunds are returned to the original payment method via Razorpay. Convenience fees and GST are refunded in line with the event’s policy and applicable law.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">Organiser cancellation</h2>
          <p>If the organiser cancels an event, eligible bookings are refunded in full. Rescheduled events honour existing tickets; affected attendees will be notified.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">No-shows</h2>
          <p>Tickets not used for entry are not refundable unless the event’s policy states otherwise.</p>
        </div>
      </div>
    </main>
  );
}
