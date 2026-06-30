import { requireAdmin } from "@/lib/admin/auth";
import { getAnalytics } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function AnalyticsPage() {
  const staff = await requireAdmin();
  const a = await getAnalytics(staff.isSuper ? undefined : staff.cityIds);

  const kpis = [
    { label: "Revenue", value: `₹${rupees(a.revenue)}` },
    { label: "Paid orders", value: a.ordersPaid },
    { label: "Tickets sold", value: a.ticketsSold },
    { label: "Comps", value: a.comps },
    { label: "Refunds", value: `${a.refundsCount} · ₹${rupees(a.refundsAmount)}` },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <a href="/api/admin/export" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-5 py-2.5 text-sm font-bold text-white">Export orders CSV</a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-muted">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">By event</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Event</th><th className="p-3">City</th><th className="p-3">Status</th><th className="p-3">Sold / Cap</th><th className="p-3">Occ.</th><th className="p-3">Revenue</th></tr>
          </thead>
          <tbody>
            {a.perEvent.map((e) => (
              <tr key={e.id} className="border-t border-black/5">
                <td className="p-3 font-medium">{e.title}</td>
                <td className="p-3 text-muted">{e.city}</td>
                <td className="p-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{e.status}</span></td>
                <td className="p-3 text-muted">{e.sold} / {e.capacity}</td>
                <td className="p-3 text-muted">{e.occ}%</td>
                <td className="p-3">₹{rupees(e.revenue)}</td>
              </tr>
            ))}
            {a.perEvent.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No events.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
