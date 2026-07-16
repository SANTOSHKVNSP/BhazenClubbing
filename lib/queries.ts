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
  headline?: string;
  heroTags?: string;
  heroBody?: string[];
  heroAccent?: string;
  ctaLabel?: string;
  tagline?: string;
  about?: { image?: string; video?: string };
  highlights?: { heading?: string; items?: string[] };
  impact?: { heading?: string; body?: string; items?: string[] };
  experience?: { heading?: string; body?: string };
  ticketsHeading?: string;
  ticketsSubtext?: string;
  admissionLabels?: Record<string, string>;
  ticketPerks?: Record<string, string>;
  ticketBadges?: Record<string, string>;
  happinessProgram?: { heading?: string; body?: string; points?: string[] };
  bulkPasses?: {
    heading?: string;
    intro?: string;
    steps?: string[];
    note?: string;
    donateUrl?: string;
    bundles?: { label: string; amount: string }[];
  };
  quote?: { lines?: string[]; author?: string };
  finalCta?: { heading?: string; body?: string; label?: string };
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
