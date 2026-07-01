/**
 * Production seed — Sattvik Beats. Seeds the single live event:
 *  1. BhaZen Jamming (Vizag, Port Stadium) — HYBRID: Premium reserved + General/Student/Family GA.
 *     Interim external ticketing via aolt.in until Razorpay is live (ADR-022).
 * Re-runnable: clears content, recreates. Run: `npx tsx prisma/seed.ts`.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { generateStadium } from "../lib/seatmap/generate";
import type { SeatMap } from "../lib/seatmap/types";

const prisma = new PrismaClient();

async function materialize(showtimeId: string, seatMap: SeatMap, ga: { id: string; capacity: number }[]) {
  const seatRows = seatMap.sections.flatMap((sec) =>
    sec.rows.flatMap((row) =>
      row.seats.map((cell) => ({
        showtimeId, section: sec.id, row: row.label, number: cell.number,
        category: cell.category, accessible: !!cell.accessible, blocked: !!cell.blocked,
      }))
    )
  );
  for (let i = 0; i < seatRows.length; i += 1000) await prisma.seat.createMany({ data: seatRows.slice(i, i + 1000) });
  for (const c of ga) await prisma.gaInventory.create({ data: { showtimeId, ticketCategoryId: c.id, capacity: c.capacity, reserved: 0 } });
  return seatRows.length;
}

const roles = [
  { role: "Lead Vocalist", photo: "/images/bhazen/nirvana-3.jpg" },
  { role: "Lead Guitarist", photo: "/images/bhazen/nirvana-16.jpg" },
  { role: "Bassist", photo: "/images/bhazen/nirvana-12.jpg" },
  { role: "Drummer", photo: "/images/bhazen/nirvana-13.jpg" },
  { role: "Keyboardist", photo: "/images/bhazen/nirvana-15.jpg" },
  { role: "Flutist", photo: "/images/bhazen/nirvana-14.jpg" },
];

const faqs = [
  { q: "How will I enter the venue?", a: "You will receive a QR Code before the event. Show it at the gate to collect your wristband for entry." },
  { q: "What time should I arrive?", a: "Gates open a couple of hours before showtime. Arrive early to collect your wristband." },
  { q: "Can I get a refund?", a: "Refund terms are shown at checkout and depend on the event's policy." },
  { q: "What items are not allowed inside?", a: "Prohibited: weapons, illegal substances, professional cameras, outside food/drinks, and laser pointers. Security checks apply." },
  { q: "How can I contact support?", a: "Call +91 97030 46062 or DM us on Instagram." },
];

const heroLogos = { aol: "/images/bhazen/AOL_LogoWhite.png", event: "/images/bhazen/bhazenclubbing.png", wafc: "/images/partners/world-forum.png" };
const contact = { phone: "+91 97030 46062", phoneLabel: "Support", instagram: "https://www.instagram.com/bhazen_jamming", instagramHandle: "@bhazen_jamming", email: "hello@sattvikbeats.com" };
const gallery = ["/images/bhazen/edit-8.jpg", "/images/bhazen/nirvana-17.jpg", "/images/bhazen/nirvana-18.jpg", "/images/bhazen/nirvana-19.jpg", "/images/bhazen/nirvana-2.jpg", "/images/bhazen/edit-5.jpg"];
const hero = "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80";
const trustUrl = "https://www.artofliving.org";
const asJson = (v: unknown) => v as unknown as Prisma.InputJsonValue;

async function main() {
  // Clear (dev only) in FK-safe order.
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.checkinEvent.deleteMany();
  await prisma.staffMembership.deleteMany();
  await prisma.eventBand.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.gaInventory.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.event.deleteMany();
  await prisma.bandMember.deleteMany();
  await prisma.band.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.city.deleteMany();

  const vizag = await prisma.city.create({ data: { slug: "vizag", name: "Visakhapatnam", state: "Andhra Pradesh", status: "live", intro: { en: "Live music in the City of Destiny." } } });

  const band = await prisma.band.create({
    data: {
      name: "Nirvana Station",
      bio: { en: "An 8-member band delivering soul-stirring live performances." },
      members: { create: roles.map((r, i) => ({ name: r.role, role: r.role, photoUrl: r.photo, sortOrder: i })) },
    },
  });

  const content = (tagline: string, stats: { value: number; suffix?: string; label: string }[]) =>
    asJson({ presents: "Art of Living", heroLogos, tagline, about: { image: "/images/bhazen/nirvana-8.jpg", video: "https://www.youtube-nocookie.com/embed/Lh1Cg1RCDTA" }, features: ["Live Band", "Photo Booth", "Merchandise"], stats, faqs, contact, trustUrl });

  // ===== 1. BhaZen Jamming — HYBRID (Vizag, Port Stadium 4500) =====
  const jammingMap = generateStadium({ sections: [{ id: "premium", label: "Premium Stand", rows: 20, seatsPerRow: 25, category: "Category: Premium" }] });
  const portStadium = await prisma.venue.create({ data: { name: "Port Stadium", cityId: vizag.id, address: "Akkayapalem, Visakhapatnam, Andhra Pradesh", template: "stadium", capacity: 4500, layoutJson: asJson(jammingMap) } });
  const jamming = await prisma.event.create({
    data: {
      slug: "bhazen-jamming", title: "BhaZen Jamming", cityId: vizag.id, venueId: portStadium.id, status: "live", ticketingMode: "external",
      description: { en: "Nirvana Station live at Port Stadium — an electrifying night inside the indoor arena. Grab a premium reserved seat up front, or join the crowd on a general-admission pass." },
      heroMediaUrl: hero, galleryJson: asJson(gallery),
      contentJson: content("An electrifying indoor night of live music", [{ value: 8, label: "Band Members" }, { value: 4500, suffix: "+", label: "Capacity" }, { value: 3, label: "Hours of Music" }, { value: 1, label: "Epic Night" }]),
      feeType: "percent", feeValue: 300, gstRate: 1800, refundPolicyType: "self_service", refundWindowDays: 3, refundFeePct: 1000,
      doorsAt: new Date("2026-07-18T18:00:00+05:30"), onSaleAt: new Date("2026-07-01T00:00:00+05:30"),
      seo: { en: { title: "BhaZen Jamming — Nirvana Station Live", description: "Nirvana Station live at Port Stadium, Visakhapatnam." } },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: { create: [{ name: "Art of Living", tier: "Presented by", url: trustUrl, sortOrder: 0 }, { name: "World Forum for Art & Culture", tier: "In association with", logoUrl: "/images/partners/world-forum.png", url: "https://worldforumforartandculture.com/", sortOrder: 1 }, { name: "Sri Sri Tattva", tier: "Partner", sortOrder: 2 }] },
    },
  });
  const jSt = await prisma.showtime.create({ data: { eventId: jamming.id, startsAt: new Date("2026-07-18T18:00:00+05:30"), status: "live" } });
  await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Category: Premium", color: "#f9d464", basePrice: 299900, admission: "reserved", bookingUrl: "https://aolt.in/1034073" } });
  const jGen = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Category: General", color: "#00acee", basePrice: 59900, admission: "general", capacity: 3000, bookingUrl: "https://aolt.in/1034076" } });
  const jStu = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Category: Student", color: "#fc097c", basePrice: 39900, admission: "general", capacity: 700, bookingUrl: "https://aolt.in/1034077" } });
  const jFam = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Category: Family", color: "#554bb9", basePrice: 199900, admission: "general", capacity: 300, bookingUrl: "https://aolt.in/1034075" } });
  const jSeats = await materialize(jSt.id, jammingMap, [{ id: jGen.id, capacity: 3000 }, { id: jStu.id, capacity: 700 }, { id: jFam.id, capacity: 300 }]);

  // Staff / RBAC (ADR-004)
  const superPhone = process.env.SUPER_ADMIN_PHONE ?? "+919999999999";
  const superUser = await prisma.user.upsert({ where: { phone: superPhone }, update: { name: "Super Admin" }, create: { phone: superPhone, name: "Super Admin" } });
  await prisma.staffMembership.create({ data: { userId: superUser.id, role: "super_admin" } });
  const cityAdmin = await prisma.user.upsert({ where: { phone: "+918888888888" }, update: { name: "Vizag Admin" }, create: { phone: "+918888888888", name: "Vizag Admin" } });
  await prisma.staffMembership.create({ data: { userId: cityAdmin.id, role: "city_admin", cityId: vizag.id } });

  console.log(`Seeded 1 live event:`);
  console.log(`  1. /e/bhazen-jamming (HYBRID @ Port Stadium, Jul 18) — ${jSeats} Premium seats + 4000 GA (General/Student/Family), external ticketing (aolt.in)`);
  console.log(`superAdmin=${superPhone}, cityAdmin=+918888888888`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
