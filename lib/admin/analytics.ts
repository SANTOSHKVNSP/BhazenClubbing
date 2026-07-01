import { prisma } from "@/lib/db";

// Revenue / sold / occupancy / refunds, scoped by city for city admins.
export async function getAnalytics(cityIds?: string[]) {
  const scope = cityIds ? { showtime: { event: { cityId: { in: cityIds } } } } : {};
  const eventScope = cityIds ? { cityId: { in: cityIds } } : {};

  const [paid, refunded, sold, comps, refundAgg] = await Promise.all([
    prisma.order.aggregate({ where: { ...scope, status: "paid" }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...scope, status: "refunded" }, _count: true }),
    prisma.ticket.count({ where: { ...scope, state: "sold" } }),
    prisma.ticket.count({ where: { ...scope, state: "comp" } }),
    prisma.refund.aggregate({
      where: cityIds ? { order: { showtime: { event: { cityId: { in: cityIds } } } } } : {},
      _sum: { amount: true },
    }),
  ]);

  const events = await prisma.event.findMany({ where: eventScope, include: { city: true }, orderBy: { createdAt: "desc" } });
  const perEvent = await Promise.all(
    events.map(async (e) => {
      const [evSold, seatCap, gaCap, rev] = await Promise.all([
        prisma.ticket.count({ where: { state: { in: ["sold", "comp"] }, showtime: { eventId: e.id } } }),
        prisma.seat.count({ where: { showtime: { eventId: e.id } } }),
        prisma.gaInventory.aggregate({ where: { showtime: { eventId: e.id } }, _sum: { capacity: true } }),
        prisma.order.aggregate({ where: { status: "paid", showtime: { eventId: e.id } }, _sum: { total: true } }),
      ]);
      const capacity = seatCap + (gaCap._sum.capacity ?? 0);
      return {
        id: e.id, title: e.title, city: e.city.name, status: e.status,
        sold: evSold, capacity, occ: capacity ? Math.round((evSold / capacity) * 100) : 0,
        revenue: rev._sum.total ?? 0,
      };
    })
  );

  return {
    revenue: paid._sum.total ?? 0,
    ordersPaid: paid._count,
    ticketsSold: sold,
    comps,
    refundsCount: refunded._count,
    refundsAmount: refundAgg._sum.amount ?? 0,
    perEvent,
  };
}
