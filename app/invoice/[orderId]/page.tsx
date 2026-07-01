import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");
const fmt = (d: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d);

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/invoice/${orderId}`)}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true, user: true, tickets: { include: { seat: true } }, showtime: { include: { event: true } } },
  });
  if (!order || order.userId !== session.user.id || !order.invoice) notFound();

  const inv = order.invoice;
  const groups = Object.values(
    order.tickets.reduce((acc: Record<string, { category: string; qty: number; unit: number; total: number }>, t) => {
      (acc[t.category] ??= { category: t.category, qty: 0, unit: t.price, total: 0 });
      acc[t.category].qty++;
      acc[t.category].total += t.price;
      return acc;
    }, {})
  );

  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-12 print:bg-white">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-10 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Tax Invoice</h1>
            <p className="mt-1 text-sm text-muted">Sattvik Beats · Art of Living</p>
            <p className="text-xs text-muted">GSTIN: {inv.gstin} · SAC: {inv.sac}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-ink">{inv.number}</p>
            <p className="text-muted">{fmt(order.paidAt ?? order.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-black/10 pt-4 text-sm">
          <p className="text-muted">Billed to</p>
          <p className="font-semibold text-ink">{order.user.phone}</p>
          <p className="text-muted">{order.showtime.event.title}</p>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead className="border-b border-black/10 text-left text-xs uppercase text-muted">
            <tr><th className="py-2">Category</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.category} className="border-b border-black/5">
                <td className="py-2">{g.category}</td>
                <td className="py-2 text-right">{g.qty}</td>
                <td className="py-2 text-right">₹{rupees(g.unit)}</td>
                <td className="py-2 text-right">₹{rupees(g.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>₹{rupees(order.subtotal)}</dd></div>
          {order.fee > 0 && <div className="flex justify-between"><dt className="text-muted">Convenience fee</dt><dd>₹{rupees(order.fee)}</dd></div>}
          {order.gst > 0 && <div className="flex justify-between"><dt className="text-muted">GST</dt><dd>₹{rupees(order.gst)}</dd></div>}
          <div className="flex justify-between border-t border-black/10 pt-2 font-display text-lg font-extrabold text-ink"><dt>Total</dt><dd>₹{rupees(order.total)}</dd></div>
        </dl>

        <p className="mt-8 text-center text-xs text-muted print:hidden">Use your browser&apos;s Print (Ctrl/Cmd&nbsp;+&nbsp;P) to save as PDF. Automated PDF delivery arrives in Phase 4.</p>
      </div>
    </main>
  );
}
