import { cache } from "react";
import { prisma } from "@/lib/db";

// Public reads — live content only. Wrapped in React cache() so multiple calls
// within one request (e.g. generateMetadata + the page) dedupe to a single query.

export const getEventBySlug = cache(async (slug: string) => {
  return prisma.event.findFirst({
    where: { slug, status: "live" },
    include: {
      city: true,
      venue: true,
      categories: { orderBy: { basePrice: "asc" } },
      showtimes: { orderBy: { startsAt: "asc" } },
      partners: { orderBy: { sortOrder: "asc" } },
      bands: {
        include: {
          band: { include: { members: { orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  });
});

export const listLiveEvents = cache(async () => {
  return prisma.event.findMany({
    where: { status: "live" },
    orderBy: { doorsAt: "asc" },
    include: {
      city: true,
      categories: { orderBy: { basePrice: "asc" }, take: 1 },
      showtimes: { orderBy: { startsAt: "asc" }, take: 1 },
    },
  });
});

export const getCityBySlug = cache(async (slug: string) => {
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
});

export const listLiveCities = cache(async () => {
  return prisma.city.findMany({
    where: { status: "live" },
    orderBy: { name: "asc" },
  });
});

export type EventContent = {
  presents?: string;
  heroLogos?: { aol?: string; event?: string; wafc?: string };
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
