import { prisma } from "@/lib/db";

// Public reads — live content only.

export async function getEventBySlug(slug: string) {
  return prisma.event.findFirst({
    where: { slug, status: "live" },
    include: {
      city: true,
      venue: true,
      categories: { orderBy: { basePrice: "asc" } },
      showtimes: { orderBy: { startsAt: "asc" } },
      bands: {
        include: {
          band: { include: { members: { orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  });
}

export async function listLiveEvents() {
  return prisma.event.findMany({
    where: { status: "live" },
    orderBy: { doorsAt: "asc" },
    include: {
      city: true,
      categories: { orderBy: { basePrice: "asc" }, take: 1 },
      showtimes: { orderBy: { startsAt: "asc" }, take: 1 },
    },
  });
}

export async function getCityBySlug(slug: string) {
  return prisma.city.findFirst({
    where: { slug, status: "live" },
    include: {
      events: {
        where: { status: "live" },
        orderBy: { doorsAt: "asc" },
        include: {
          categories: { orderBy: { basePrice: "asc" }, take: 1 },
          showtimes: { orderBy: { startsAt: "asc" }, take: 1 },
        },
      },
    },
  });
}

export async function listLiveCities() {
  return prisma.city.findMany({
    where: { status: "live" },
    orderBy: { name: "asc" },
  });
}

export type EventContent = {
  presents?: string;
  heroLogos?: { aol?: string; event?: string };
  tagline?: string;
  about?: { image?: string; video?: string };
  features?: string[];
  stats?: { value: number; suffix?: string; label: string }[];
  faqs?: { q: string; a: string }[];
  contact?: {
    phone?: string;
    phoneLabel?: string;
    instagram?: string;
    instagramHandle?: string;
    email?: string;
  };
  trustUrl?: string;
};
