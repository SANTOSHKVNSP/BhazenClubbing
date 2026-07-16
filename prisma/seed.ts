/**
 * Production seed — Sattvik Beats. Seeds the single live event:
 *  1. BhaZen Jamming 2.0 (Vizag, Port Indoor Stadium) — a fundraiser concert for
 *     the Green Vizag Initiative by The Art of Living. Interim external ticketing
 *     via aolt.in until Razorpay is live (ADR-022).
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

// The Nirvana Station line-up. Portraits live in public/images/bhazen/members/
// (the page falls back to a gradient initials avatar when photoUrl is empty).
const members = [
  { name: "Anivart Jhunjhunwala", role: "Lead Vocalist", photoUrl: "/images/bhazen/members/anivart.jpeg" },
  { name: "Anagha Karvir", role: "Lead Vocalist", photoUrl: "/images/bhazen/members/anagha.jpeg" },
  { name: "Bryan Kharrinam", role: "Guitarist", photoUrl: "/images/bhazen/members/bryan.jpeg" },
  { name: "Ram Krishna Mishra", role: "Keyboardist", photoUrl: "/images/bhazen/members/ram-krishna.jpeg" },
  { name: "Tanmay Patil", role: "Drummer", photoUrl: "/images/bhazen/members/tanmay.jpeg" },
  { name: "Sujit Dhananjay Jare", role: "Percussionist", photoUrl: "/images/bhazen/members/sujit.jpeg" },
  { name: "Sarath Narayan", role: "Percussionist", photoUrl: "/images/bhazen/members/sarath.jpeg" },
  { name: "Tigil Thomas", role: "Bassist", photoUrl: "/images/bhazen/members/tigil.jpeg" },
];

const faqs = [
  { q: "How do I enter?", a: "Your QR code will be sent before the event. Scan it at the venue to collect your wristband." },
  { q: "What time should I arrive?", a: "Gates open early. Arrive ahead of time to enjoy the complete experience." },
  { q: "Are tickets refundable?", a: "Please refer to the refund policy displayed during checkout." },
  { q: "What items are prohibited?", a: "Outside food and beverages, professional cameras, laser pointers, weapons, and illegal substances are not permitted." },
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
      name: "The Nirvana Station",
      bio: { en: "After setting the stage on fire with a sold-out, unforgettable performance at BhaZen Jamming 1.0, The Nirvana Station returns to Vizag by popular demand. Get ready for another evening of soulful melodies, electrifying energy, and a musical experience that promises to be even bigger." },
      members: { create: members.map((m, i) => ({ name: m.name, role: m.role, photoUrl: m.photoUrl, sortOrder: i })) },
    },
  });

  // ===== BhaZen Jamming 2.0 — fundraiser concert (Vizag, Port Indoor Stadium 4500) =====
  const jammingMap = generateStadium({ sections: [{ id: "premium", label: "Premium Stand", rows: 20, seatsPerRow: 25, category: "Premium" }] });
  const portStadium = await prisma.venue.create({ data: { name: "Port Indoor Stadium", cityId: vizag.id, address: "Akkayapalem, Visakhapatnam, Andhra Pradesh", template: "stadium", capacity: 4500, layoutJson: asJson(jammingMap) } });
  const jamming = await prisma.event.create({
    data: {
      slug: "bhazen-jamming", title: "BhaZen Jamming", cityId: vizag.id, venueId: portStadium.id, status: "live", ticketingMode: "external",
      description: { en: "BhaZen Jamming isn't just about music, it's about making a difference. Celebrate an evening of soulful performances, community, and purpose — knowing that your participation supports The Art of Living's Green Vizag Initiative, culminating in a plantation drive on 26th July 2026. Every beat you enjoy helps plant the future." },
      heroMediaUrl: hero, galleryJson: asJson(gallery),
      contentJson: asJson({
        presents: "Art of Living",
        heroLogos,
        headline: "Where Every Beat Plants a Future",
        heroTags: "Music • Meditation • Plantation",
        heroAccent: "🎵 One Night. One Purpose. A Greener Tomorrow.",
        ctaLabel: "Reserve Your Spot",
        tagline: "More Than a Concert",
        about: { image: "/images/bhazen/nirvana-8.jpg", video: "https://www.youtube-nocookie.com/embed/Lh1Cg1RCDTA" },
        highlights: {
          heading: "What Awaits You",
          items: [
            "🎶 Live Performance by The Nirvana Station",
            "🌿 Support the Green Vizag Initiative",
            "📸 Instagram-worthy Photo Booths",
            "💚 A Community United for a Cause",
            "✨ An unforgettable evening of music and celebration",
          ],
        },
        impact: {
          heading: "Your Ticket Creates Change",
          body: "When you attend BhaZen Jamming, you're doing more than booking a concert. You're contributing to a movement dedicated to making Visakhapatnam cleaner, greener, and more sustainable. Every ticket helps support:",
          items: ["Plantation drives", "Environmental initiatives", "Community-led green action", "A greener future for Vizag"],
        },
        ticketsHeading: "Choose Your Pass",
        ticketsSubtext: "Reserve your seat today and be part of a night where every beat creates impact.",
        admissionLabels: {
          "Gallery": "General Admission",
          "Arena (Stage Area Seating)": "General Admission",
          "Premium (Seat Only)": "Reserved Seat",
          "Premium + Sudarshan Kriya": "Reserved Seat",
        },
        ticketPerks: {
          "Premium + Sudarshan Kriya": "✨ Includes a complimentary Happiness Program",
        },
        ticketBadges: {
          "Arena (Stage Area Seating)": "Fast Filling",
        },
        happinessProgram: {
          heading: "Your Premium Pass Includes Sudarshan Kriya",
          body: "The ₹2,999 Premium pass comes with a complimentary Art of Living Happiness Program — where you learn Sudarshan Kriya, the world-renowned rhythmic breathing practice followed by millions worldwide for deep calm, steady energy, and emotional balance.",
          points: [
            "Complimentary with every Premium (₹2,999) pass — a gift worth far more",
            "A guided 3–4 day Happiness Program in late July 2026",
            "Pick a time slot that suits you from the available sessions",
            "Learn Sudarshan Kriya for lasting wellness, clarity & happiness",
          ],
        },
        bulkPasses: {
          heading: "Booking for a Group?",
          intro: "Save more on Gallery & Arena passes. Bulk bookings go through our secure donation page.",
          donateUrl: "https://www.artofliving.online/donate.php?nca_id=1033929",
          steps: [
            "Tap your bundle below — it opens our donation page in a new tab.",
            "Choose 'Other Amount' and enter the exact amount shown on your bundle.",
            "Complete payment — we'll confirm your passes on WhatsApp / email.",
          ],
          bundles: [
            { label: "4 Gallery passes", amount: "₹1,400" },
            { label: "10 Gallery passes", amount: "₹3,000" },
            { label: "4 Arena passes", amount: "₹2,000" },
            { label: "10 Arena passes", amount: "₹4,500" },
          ],
          note: "Bulk passes are confirmed after payment. Need help? WhatsApp +91 97030 46062.",
        },
        quote: {
          lines: ["Sound stretched is music.", "Movement stretched is dance.", "Mind stretched is meditation.", "Life stretched is celebration."],
          author: "Gurudev Sri Sri Ravi Shankar",
        },
        finalCta: {
          heading: "Every Beat Plants a Future",
          body: "Music has the power to inspire. Together, it also has the power to transform a city. Join us for an evening of music, meditation, and purpose — and help build a greener Vizag.",
          label: "Reserve Your Spot Today",
        },
        stats: [
          { value: 8, label: "Band Members" },
          { value: 4500, suffix: "+", label: "Capacity" },
          { value: 3, label: "Hours of Music" },
          { value: 1, label: "Epic Night" },
        ],
        faqs,
        contact,
        trustUrl,
      }),
      feeType: "percent", feeValue: 300, gstRate: 1800, refundPolicyType: "self_service", refundWindowDays: 3, refundFeePct: 1000,
      doorsAt: new Date("2026-07-18T17:00:00+05:30"), onSaleAt: new Date("2026-07-01T00:00:00+05:30"),
      seo: { en: { title: "BhaZen Jamming 2.0 — Live Music for a Greener Vizag", description: "The Nirvana Station live at Port Indoor Stadium, Visakhapatnam — a fundraiser concert by The Art of Living supporting the Green Vizag Initiative." } },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: { create: [{ name: "Art of Living", tier: "Presented by", url: trustUrl, sortOrder: 0 }, { name: "World Forum for Art & Culture", tier: "In association with", logoUrl: "/images/partners/world-forum.png", url: "https://worldforumforartandculture.com/", sortOrder: 1 }, { name: "Sri Sri Tattva", tier: "Partner", sortOrder: 2 }] },
    },
  });
  const jSt = await prisma.showtime.create({ data: { eventId: jamming.id, startsAt: new Date("2026-07-18T17:00:00+05:30"), status: "live" } });
  // Tiers (external ticketing). Prices map to their aolt.in links; admission labels live in contentJson.admissionLabels.
  const jGallery = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Gallery", color: "#fc097c", basePrice: 39900, admission: "general", capacity: 2000, bookingUrl: "https://aolt.in/1034077" } });
  const jArena = await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Arena (Stage Area Seating)", color: "#00acee", basePrice: 59900, admission: "general", capacity: 1500, bookingUrl: "https://aolt.in/1034076" } });
  await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Premium (Seat Only)", color: "#554bb9", basePrice: 199900, admission: "reserved", bookingUrl: "https://aolt.in/1034075" } });
  await prisma.ticketCategory.create({ data: { eventId: jamming.id, name: "Premium + Sudarshan Kriya", color: "#f9d464", basePrice: 299900, admission: "reserved", bookingUrl: "https://aolt.in/1034073" } });
  const jSeats = await materialize(jSt.id, jammingMap, [{ id: jGallery.id, capacity: 2000 }, { id: jArena.id, capacity: 1500 }]);

  // Staff / RBAC (ADR-004)
  const superPhone = process.env.SUPER_ADMIN_PHONE ?? "+919999999999";
  const superUser = await prisma.user.upsert({ where: { phone: superPhone }, update: { name: "Super Admin" }, create: { phone: superPhone, name: "Super Admin" } });
  await prisma.staffMembership.create({ data: { userId: superUser.id, role: "super_admin" } });
  const cityAdmin = await prisma.user.upsert({ where: { phone: "+918888888888" }, update: { name: "Vizag Admin" }, create: { phone: "+918888888888", name: "Vizag Admin" } });
  await prisma.staffMembership.create({ data: { userId: cityAdmin.id, role: "city_admin", cityId: vizag.id } });

  console.log(`Seeded 1 live event:`);
  console.log(`  1. /e/bhazen-jamming (BhaZen Jamming 2.0 @ Port Indoor Stadium, Jul 18, 5 PM) — ${jSeats} Premium seats + GA, external ticketing (aolt.in)`);
  console.log(`superAdmin=${superPhone}, cityAdmin=+918888888888`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
