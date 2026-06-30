import Link from "next/link";
import { adminListOrders } from "@/lib/admin/queries";
import { adminRefundOrder } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function OrdersList() {
  const orders = await adminListOrders();
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Event</th><th className="p-3">Customer</th><th className="p-3">Seats</th>
              <th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Invoice</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-black/5">
                <td className="p-3 font-medium">{o.showtime.event.title}</td>
                <td className="p-3 text-muted">{o.user.phone}</td>
                <td className="p-3 text-muted">{o._count.tickets}</td>
                <td className="p-3">₹{rupees(o.total)}</td>
                <td className="p-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{o.status}</span></td>
                <td className="p-3 text-muted">{o.invoice ? <Link href={`/invoice/${o.id}`} className="text-orange-2 hover:underline">{o.invoice.number}</Link> : "—"}</td>
                <td className="p-3 text-right">
                  {o.status === "paid" && (
                    <form action={adminRefundOrder}><input type="hidden" name="id" value={o.id} /><button className="text-xs text-red-600 hover:underline">Refund</button></form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
