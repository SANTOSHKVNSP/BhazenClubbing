import Link from "next/link";

export const metadata = { title: "Terms of Service — Sattvik Beats" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 text-ink">
        <Link href="/" className="text-sm font-semibold text-orange-2 hover:underline">← Home</Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Sattvik Beats (Art of Living) · <span className="italic">Draft — pending legal review</span></p>
        <div className="mt-8 space-y-3 text-[15px] leading-relaxed text-ink/80">
          <h2 className="pt-4 font-display text-xl font-bold text-ink">1. Tickets</h2>
          <p>A ticket is a revocable licence to attend the specified event. It is valid for one entry and must be presented as a QR code, which is exchanged for a wristband at the venue. Student passes require a valid student ID at entry.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">2. Entry &amp; conduct</h2>
          <p>The organiser may refuse entry or remove any attendee for unsafe or unlawful conduct. Attendees must comply with venue rules and security checks. Re-entry is at the organiser’s discretion.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">3. Changes &amp; cancellation</h2>
          <p>Line-up, timings, and venue may change. If the organiser cancels an event, refunds are issued per the <Link href="/refund-policy" className="text-orange-2 underline">Refund Policy</Link>.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">4. Liability</h2>
          <p>Attendance is at your own risk. To the extent permitted by law, the organiser’s liability is limited to the ticket price paid.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">5. Governing law</h2>
          <p>These terms are governed by the laws of India, with jurisdiction in the event’s city.</p>
        </div>
      </div>
    </main>
  );
}
