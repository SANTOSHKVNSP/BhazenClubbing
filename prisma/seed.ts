/**
 * Dev seed — Sattvik Beats. Seeds 3 events showcasing all admission styles:
 *  1. BhaZen Jamming (Vizag, Port Stadium) — HYBRID: Premium reserved + General/Student GA.
 *  2. Sattvik Strings (Hyderabad) — THEATRE (reserved).
 *  3. Sattvik Rhythms (Bengaluru) — STADIUM (reserved).
 * Re-runnable: clears content, recreates. Run: `npx tsx prisma/seed.ts`.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { generateTheatre, generateStadium } from "../lib/seatmap/generate";
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
  { q: "How do I purchase tickets?", a: "Tap “Buy Ticket Now”, choose your tickets (reserved seats or general admission), and complete your booking securely." },
  { q: "How will I enter the venue?", a: "You will receive a QR Code before the event. Show it at the gate to collect your wristband for entry." },
  { q: "What time should I arrive?", a: "Gates open a couple of hours before showtime. Arrive early to collect your wristband." },
  { q: "Can I get a refund?", a: "Refund terms are shown at checkout and depend on the event's policy." },
  { q: "What items are not allowed inside?", a: "Prohibited: weapons, illegal substances, professional cameras, outside food/drinks, and laser pointers. Security checks apply." },
  { q: "How can I contact support?", a: "Call +91 97030 46062 or DM us on Instagram." },
];

const heroLogos = { aol: "/images/bhazen/AOL_LogoWhite.png", event: "/images/bhazen/bhazenclubbing.png" };
const contact = { phone: "+91 97030 46062", phoneLabel: "Support", instagram: "https://www.instagram.com/bhazen_clubbing", instagramHandle: "@sattvikbeats", email: "hello@sattvikbeats.com" };
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
  const hyd = await prisma.city.create({ data: { slug: "hyderabad", name: "Hyderabad", state: "Telangana", status: "live", intro: { en: "Concerts in the City of Pearls." } } });
  const blr = await prisma.city.create({ data: { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", status: "live", intro: { en: "Live shows in India's garden city." } } });

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
  const jammingMap = generateStadium({ sections: [{ id: "premium", label: "Premium Stand", rows: 20, seatsPerRow: 25, category: "Premium Pass" }] });
  const portStadium = await prisma.venue.create({ data: { name: "Port Stadium", cityId: vizag.id, address: "Akkayapalem, Visakhapatnam, Andhra Pradesh", template: "stadium", capacity: 4500, layoutJson: asJson(jammingMap) } });
  const jamming = await prisma.event.create({
    data: {
      slug: "bhazen-jamming", title: "BhaZen Jamming", cityId: vizag.id, venueId: portStadium.id, status: "live",
      description: { en: "Nirvana Station live at Port Stadium — an electrifying open-air night. Grab a premium reserved seat up front, or join the crowd on a general-admission pass." },
      heroMediaUrl: hero, galleryJson: asJson(gallery),
      contentJson: content("An open-air night of music under the stars", [{ value: 8, label: "Band Members" }, { value: 4500, suffix: "+", label: "Capacity" }, { value: 3, label: "Hours of Music" }, { value: 1, label: "Epic Night" }]),
      feeType: "percent", feeValue: 300, gstRate: 1800, refundPolicyType: "self_service", refundWindowDays: 3, refundFeePct: 1000,
      doorsAt: new Date("2026-07-18T18:00:00+05:30"), onSaleAt: new Date("2026-07-01T00:00:00+05:30"),
      seo: { en: { title: "BhaZen Jamming — Nirvana Station Live", description: "Nirvana Station live at Port Stadium, Visakhapatnam." } },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: { create: [{ name: "Art of Living", tier: "Presented by", url: trustUrl, sortOrder: 0 }, { name: "Sri Sri Tattva", tier: "Partner", sortOrder: 1 }] },
    },
  });
  const jSt = await prisma.showtime.create({ data: { eventId: jamming.id, startsAt: new Date("2026-07-18T18:00:00+05:30"), status: "live" } });
  await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Premium Pass", color: "#f9d464", basePrice: 299900, admission: "reserved" } });
  const jGen = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "General Pass", color: "#00acee", basePrice: 59900, admission: "general", capacity: 3000 } });
  const jStu = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Student Pass", color: "#fc097c", basePrice: 39900, admission: "general", capacity: 700 } });
  const jFam = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Family Pack", color: "#554bb9", basePrice: 199900, admission: "general", capacity: 300 } });
  const jSeats = await materialize(jSt.id, jammingMap, [{ id: jGen.id, capacity: 3000 }, { id: jStu.id, capacity: 700 }, { id: jFam.id, capacity: 300 }]);

  // ===== 2. Sattvik Strings — THEATRE (Hyderabad) =====
  const theatreMap = generateTheatre({ rows: 12, seatsPerRow: 20, tiers: [{ category: "Gold", rows: 4 }, { category: "Silver", rows: 4 }, { category: "Bronze", rows: 4 }], sectionLabel: "Auditorium" });
  const ravindra = await prisma.venue.create({ data: { name: "Ravindra Bharathi", cityId: hyd.id, address: "Lakdikapul, Hyderabad, Telangana", template: "theatre", capacity: 240, layoutJson: asJson(theatreMap) } });
  const strings = await prisma.event.create({
    data: {
      slug: "sattvik-strings", title: "Sattvik Strings", cityId: hyd.id, venueId: ravindra.id, status: "live",
      description: { en: "An intimate evening of classical fusion — fully reserved theatre seating. (Demo event.)" },
      heroMediaUrl: hero, galleryJson: asJson(gallery),
      contentJson: content("An intimate evening of classical fusion", [{ value: 8, label: "Musicians" }, { value: 240, label: "Seats" }, { value: 2, label: "Hours" }]),
      feeType: "flat", feeValue: 3000, gstRate: 1800, refundPolicyType: "self_service", refundWindowDays: 2,
      doorsAt: new Date("2026-08-15T18:30:00+05:30"), onSaleAt: new Date("2026-07-01T00:00:00+05:30"),
      seo: { en: { title: "Sattvik Strings — Hyderabad", description: "Classical fusion, reserved theatre seating." } },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: { create: [{ name: "Art of Living", tier: "Presented by", url: trustUrl, sortOrder: 0 }] },
    },
  });
  const sSt = await prisma.showtime.create({ data: { eventId: strings.id, startsAt: new Date("2026-08-15T18:30:00+05:30"), status: "live" } });
  await prisma.ticketCategory.createMany({ data: [
    { eventId: strings.id, name: "Gold", color: "#f9d464", basePrice: 199900, admission: "reserved" },
    { eventId: strings.id, name: "Silver", color: "#c0c7d0", basePrice: 129900, admission: "reserved" },
    { eventId: strings.id, name: "Bronze", color: "#cd7f4d", basePrice: 79900, admission: "reserved" },
  ] });
  const sSeats = await materialize(sSt.id, theatreMap, []);

  // ===== 3. Sattvik Rhythms — STADIUM (Bengaluru) =====
  const stadiumMap = generateStadium({ sections: [
    { id: "vip", label: "VIP Block", rows: 8, seatsPerRow: 25, category: "VIP" },
    { id: "north", label: "North Stand", rows: 12, seatsPerRow: 25, category: "Standard" },
    { id: "south", label: "South Stand", rows: 12, seatsPerRow: 25, category: "Standard" },
  ] });
  const kanteerava = await prisma.venue.create({ data: { name: "Kanteerava Indoor Stadium", cityId: blr.id, address: "Kanteerava Stadium, Bengaluru, Karnataka", template: "stadium", capacity: 800, layoutJson: asJson(stadiumMap) } });
  const rhythms = await prisma.event.create({
    data: {
      slug: "sattvik-rhythms", title: "Sattvik Rhythms", cityId: blr.id, venueId: kanteerava.id, status: "live",
      description: { en: "A high-energy stadium night — reserved seating across VIP and standard blocks. (Demo event.)" },
      heroMediaUrl: hero, galleryJson: asJson(gallery),
      contentJson: content("A high-energy stadium night", [{ value: 8, label: "Band Members" }, { value: 800, label: "Seats" }, { value: 3, label: "Hours" }]),
      feeType: "percent", feeValue: 250, gstRate: 1800, refundPolicyType: "admin_only",
      doorsAt: new Date("2026-08-30T18:00:00+05:30"), onSaleAt: new Date("2026-07-01T00:00:00+05:30"),
      seo: { en: { title: "Sattvik Rhythms — Bengaluru", description: "Stadium concert, reserved seating." } },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: { create: [{ name: "Art of Living", tier: "Presented by", url: trustUrl, sortOrder: 0 }] },
    },
  });
  const rSt = await prisma.showtime.create({ data: { eventId: rhythms.id, startsAt: new Date("2026-08-30T18:00:00+05:30"), status: "live" } });
  await prisma.ticketCategory.createMany({ data: [
    { eventId: rhythms.id, name: "VIP", color: "#ff1493", basePrice: 249900, admission: "reserved" },
    { eventId: rhythms.id, name: "Standard", color: "#00ced1", basePrice: 99900, admission: "reserved" },
  ] });
  const rSeats = await materialize(rSt.id, stadiumMap, []);

  // Staff / RBAC (ADR-004)
  const superPhone = process.env.SUPER_ADMIN_PHONE ?? "+919999999999";
  const superUser = await prisma.user.upsert({ where: { phone: superPhone }, update: { name: "Super Admin" }, create: { phone: superPhone, name: "Super Admin" } });
  await prisma.staffMembership.create({ data: { userId: superUser.id, role: "super_admin" } });
  const cityAdmin = await prisma.user.upsert({ where: { phone: "+918888888888" }, update: { name: "Vizag Admin" }, create: { phone: "+918888888888", name: "Vizag Admin" } });
  await prisma.staffMembership.create({ data: { userId: cityAdmin.id, role: "city_admin", cityId: vizag.id } });

  console.log(`Seeded 3 events:`);
  console.log(`  1. /e/bhazen-jamming (HYBRID @ Port Stadium, Jul 18) — ${jSeats} Premium seats + 4000 GA (General/Student/Family)`);
  console.log(`  2. /e/sattvik-strings (THEATRE @ Hyderabad) — ${sSeats} seats`);
  console.log(`  3. /e/sattvik-rhythms (STADIUM @ Bengaluru) — ${rSeats} seats`);
  console.log(`superAdmin=${superPhone}, cityAdmin=+918888888888`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
