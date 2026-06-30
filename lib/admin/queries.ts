import { prisma } from "@/lib/db";

// Admin reads — all statuses (not live-only).

export const adminStats = async () => ({
  cities: await prisma.city.count(),
  venues: await prisma.venue.count(),
  bands: await prisma.band.count(),
  events: await prisma.event.count(),
  live: await prisma.event.count({ where: { status: "live" } }),
});

export const adminListCities = () =>
  prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true, venues: true } } },
  });
export const adminGetCity = (id: string) => prisma.city.findUnique({ where: { id } });

export const adminListVenues = () =>
  prisma.venue.findMany({
    orderBy: { name: "asc" },
    include: { city: true, _count: { select: { events: true } } },
  });
export const adminGetVenue = (id: string) => prisma.venue.findUnique({ where: { id } });

export const adminListBands = () =>
  prisma.band.findMany({
    orderBy: { name: "asc" },
    include: { members: { orderBy: { sortOrder: "asc" } }, _count: { select: { events: true } } },
  });
export const adminGetBand = (id: string) =>
  prisma.band.findUnique({ where: { id }, include: { members: { orderBy: { sortOrder: "asc" } } } });

export const adminListEvents = (cityIds?: string[]) =>
  prisma.event.findMany({
    where: cityIds ? { cityId: { in: cityIds } } : undefined,
    orderBy: { createdAt: "desc" },
    include: { city: true, venue: true, _count: { select: { showtimes: true } } },
  });
export const adminGetEvent = (id: string) =>
  prisma.event.findUnique({
    where: { id },
    include: {
      city: true,
      venue: true,
      categories: { orderBy: { basePrice: "asc" } },
      showtimes: { orderBy: { startsAt: "asc" }, include: { _count: { select: { seats: true } } } },
      partners: { orderBy: { sortOrder: "asc" } },
      promos: { orderBy: { createdAt: "desc" } },
      comps: { orderBy: { createdAt: "desc" } },
      bands: { include: { band: true } },
    },
  });

export const adminListOrders = (cityIds?: string[]) =>
  prisma.order.findMany({
    where: cityIds ? { showtime: { event: { cityId: { in: cityIds } } } } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      showtime: { include: { event: true } },
      invoice: true,
      _count: { select: { tickets: true } },
    },
  });

// Select options
export const optionCities = () => prisma.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
export const optionVenues = () => prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
export const optionBands = () => prisma.band.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
