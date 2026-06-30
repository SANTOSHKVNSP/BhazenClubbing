/**
 * Dev seed — Sattvick Beats. Seeds the first event (BhaZen Clubbing, Vizag).
 * Re-runnable: clears content tables, then recreates. Run: `npx tsx prisma/seed.ts`.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { generateTheatre } from "../lib/seatmap/generate";

const prisma = new PrismaClient();

async function main() {
  // Clear (dev only) in FK-safe order.
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.checkinEvent.deleteMany();
  await prisma.eventBand.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.event.deleteMany();
  await prisma.bandMember.deleteMany();
  await prisma.band.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.city.deleteMany();

  const city = await prisma.city.create({
    data: {
      slug: "vizag",
      name: "Visakhapatnam",
      state: "Andhra Pradesh",
      status: "live",
      intro: { en: "Live music in the City of Destiny." },
      seo: {
        en: {
          title: "Sattvick Beats — Visakhapatnam",
          description: "Live concerts in Visakhapatnam by Art of Living.",
        },
      },
    },
  });

  const seatMap = generateTheatre({
    rows: 14,
    seatsPerRow: 24,
    tiers: [
      { category: "Gold", rows: 4 },
      { category: "Silver", rows: 5 },
      { category: "Bronze", rows: 5 },
    ],
    sectionLabel: "Auditorium",
  });

  const venue = await prisma.venue.create({
    data: {
      name: "Gurajada Kalakshetram",
      cityId: city.id,
      address: "Siripuram, Visakhapatnam, Andhra Pradesh, India",
      template: "theatre",
      capacity: 2500,
      layoutJson: seatMap as unknown as Prisma.InputJsonValue,
      mapsEmbed:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15202.060860575693!2d83.3004605554199!3d17.720347000000015!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3943002684e6eb%3A0xc13c5c7e5bf80e6b!2sGurajada%20Kalakhestram!5e0!3m2!1sen!2sus!4v1768498886773!5m2!1sen!2sus",
    },
  });

  const roles = [
    { role: "Lead Vocalist", photo: "/images/bhazen/nirvana-3.jpg" },
    { role: "Lead Guitarist", photo: "/images/bhazen/nirvana-16.jpg" },
    { role: "Bassist", photo: "/images/bhazen/nirvana-12.jpg" },
    { role: "Drummer", photo: "/images/bhazen/nirvana-13.jpg" },
    { role: "Keyboardist", photo: "/images/bhazen/nirvana-15.jpg" },
    { role: "Flutist", photo: "/images/bhazen/nirvana-14.jpg" },
  ];

  const band = await prisma.band.create({
    data: {
      name: "Nirvana Station",
      bio: { en: "An 8-member band delivering soul-stirring live performances." },
      members: {
        create: roles.map((r, i) => ({
          name: r.role,
          role: r.role,
          photoUrl: r.photo,
          sortOrder: i,
        })),
      },
    },
  });

  const faqs = [
    { q: "How do I purchase tickets?", a: "Tap “Buy Ticket Now”, choose Student Pass (₹299) or General Pass (₹499), and complete your booking securely." },
    { q: "How will I enter the venue?", a: "You will receive a QR Code 2 days before the event. Show it at the gate to collect your wristband for entry." },
    { q: "What time should I arrive at the venue?", a: "Gates open at 5:30 PM on January 25, 2026. Arrive early to collect your wristband and enjoy the pre-show activities." },
    { q: "Is parking available at the venue?", a: "Yes, parking is available at Gurajada Kalakshetram. We recommend carpooling or ride-sharing as parking may be limited." },
    { q: "Can I get a refund if I can't attend?", a: "All ticket sales are final. Refunds are only provided if the event is cancelled or postponed." },
    { q: "Can I bring my own food and drinks?", a: "Outside food and drinks are not permitted inside the venue." },
    { q: "What items are not allowed inside?", a: "Prohibited: weapons, illegal substances, professional cameras with detachable lenses, outside food/drinks, and laser pointers. Security checks apply at entry." },
    { q: "How can I contact support?", a: "Call +91 97030 46062, email bhazenclubbing@gmail.com, or DM @bhazen_clubbing on Instagram." },
  ];

  const event = await prisma.event.create({
    data: {
      slug: "bhazen-clubbing",
      title: "BhaZen Clubbing",
      cityId: city.id,
      venueId: venue.id,
      status: "live",
      description: {
        en: "Get ready for an electrifying night as Nirvana Station takes the stage at BhaZen Clubbing! Experience soul-stirring performances, incredible energy, and a night you'll never forget at the iconic Gurajada Kalakshetram in Visakhapatnam.",
      },
      heroMediaUrl:
        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80",
      galleryJson: [
        "/images/bhazen/edit-8.jpg",
        "/images/bhazen/nirvana-17.jpg",
        "/images/bhazen/nirvana-18.jpg",
        "/images/bhazen/nirvana-19.jpg",
        "/images/bhazen/nirvana-2.jpg",
        "/images/bhazen/nirvana-20.jpg",
        "/images/bhazen/edit-5.jpg",
        "/images/bhazen/edit-11.jpg",
      ],
      contentJson: {
        presents: "Art of Living",
        heroLogos: {
          aol: "/images/bhazen/AOL_LogoWhite.png",
          event: "/images/bhazen/bhazenclubbing.png",
        },
        tagline: "An unforgettable night of music & entertainment",
        about: {
          image: "/images/bhazen/nirvana-8.jpg",
          video: "https://www.youtube-nocookie.com/embed/Lh1Cg1RCDTA",
        },
        features: ["Live Band", "Photo Booth", "Merchandise"],
        stats: [
          { value: 8, label: "Band Members" },
          { value: 2500, suffix: "+", label: "Attendees" },
          { value: 3, label: "Hours of Music" },
          { value: 1, label: "Epic Night" },
        ],
        faqs,
        contact: {
          phone: "+91 97030 46062",
          phoneLabel: "Santosh",
          instagram: "https://www.instagram.com/bhazen_clubbing",
          instagramHandle: "@bhazen_clubbing",
          email: "bhazenclubbing@gmail.com",
        },
        trustUrl: "https://www.artofliving.org",
      },
      feeType: "none",
      feeValue: 0,
      gstRate: 0,
      refundPolicyType: "none",
      onSaleAt: new Date("2025-12-01T00:00:00+05:30"),
      doorsAt: new Date("2026-01-25T17:30:00+05:30"),
      seo: {
        en: {
          title: "BhaZen Clubbing — Nirvana Station Live",
          description:
            "Experience Nirvana Station live at BhaZen Clubbing on January 25th, 2026 at Gurajada Kalakshetram, Visakhapatnam.",
        },
      },
      bands: { create: [{ band: { connect: { id: band.id } } }] },
      partners: {
        create: [
          { name: "Art of Living", tier: "Presented by", url: "https://www.artofliving.org", sortOrder: 0 },
          { name: "Sri Sri Tattva", tier: "Partner", sortOrder: 1 },
        ],
      },
    },
  });

  const showtime = await prisma.showtime.create({
    data: {
      eventId: event.id,
      startsAt: new Date("2026-01-25T17:30:00+05:30"),
      status: "live",
    },
  });

  await prisma.ticketCategory.createMany({
    data: [
      { eventId: event.id, name: "Gold", color: "#f9d464", basePrice: 149900 },
      { eventId: event.id, name: "Silver", color: "#c0c7d0", basePrice: 99900 },
      { eventId: event.id, name: "Bronze", color: "#cd7f4d", basePrice: 59900 },
    ],
  });

  // Materialize seats for the showtime from the venue layout.
  const seatRows = seatMap.sections.flatMap((sec) =>
    sec.rows.flatMap((row) =>
      row.seats.map((cell) => ({
        showtimeId: showtime.id,
        section: sec.id,
        row: row.label,
        number: cell.number,
        category: cell.category,
        accessible: !!cell.accessible,
        blocked: !!cell.blocked,
      }))
    )
  );
  await prisma.seat.createMany({ data: seatRows });

  console.log(
    `Seeded: city=${city.slug}, event=/e/${event.slug}, band=${band.name}, seats=${seatRows.length}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
