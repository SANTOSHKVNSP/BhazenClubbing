import Link from "next/link";

export const metadata = { title: "Privacy Policy — Sattvik Beats" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 text-ink">
        <Link href="/" className="text-sm font-semibold text-orange-2 hover:underline">← Home</Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Sattvik Beats (Art of Living) · <span className="italic">Draft — pending legal review</span></p>
        <div className="mt-8 space-y-3 text-[15px] leading-relaxed text-ink/80">
          <h2 className="pt-4 font-display text-xl font-bold text-ink">What we collect</h2>
          <p>Your mobile number (for login and ticket delivery), optional name and email, and your booking details. Payments are processed by Razorpay; we do not store card details.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">How we use it</h2>
          <p>To authenticate you, issue and deliver tickets, process refunds, admit you at the venue, and send event updates. Aggregate, non-identifying data informs event planning.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">Sharing</h2>
          <p>We share data only with service providers needed to run the event (payments, messaging) and where required by law. We do not sell your data.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">Retention &amp; your rights</h2>
          <p>We keep booking records as required for accounting and tax. You may request access or deletion of your personal data, subject to legal retention requirements.</p>
          <h2 className="pt-4 font-display text-xl font-bold text-ink">Contact</h2>
          <p>For privacy requests, contact the organiser via the details on the event page.</p>
        </div>
      </div>
    </main>
  );
}
