import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { selfRefund } from "@/lib/booking/checkout-actions";

export const dynamic = "force-dynamic";
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { invoice: true, tickets: { include: { seat: true } }, showtime: { include: { event: true } } },
  });

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">My bookings</h1>
            <p className="text-sm text-muted">{session.user.phone}</p>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-sm text-muted hover:text-ink hover:underline">Log out</button>
          </form>
        </div>

        {orders.length === 0 ? (
          <p className="mt-10 rounded-xl bg-white p-6 text-muted shadow-sm">No bookings yet. <Link href="/" className="text-orange-2 hover:underline">Explore events →</Link></p>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o) => {
              const seats = o.tickets.map((t) => `${t.seat.row}${t.seat.number}`).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
              return (
                <div key={o.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-ink">{o.showtime.event.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === "paid" ? "bg-green-100 text-green-700" : "bg-black/5 text-muted"}`}>{o.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">Seats: {seats.join(", ") || "—"}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">₹{rupees(o.total)}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    {o.invoice && <Link href={`/invoice/${o.id}`} className="text-orange-2 hover:underline">Invoice</Link>}
                    {o.status === "paid" &&
                      o.showtime.event.refundPolicyType === "self_service" &&
                      Date.now() < o.showtime.startsAt.getTime() - (o.showtime.event.refundWindowDays ?? 0) * 86_400_000 && (
                        <form action={selfRefund}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button className="text-red-600 hover:underline">Cancel &amp; refund</button>
                        </form>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
