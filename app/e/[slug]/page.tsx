import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, type EventContent } from "@/lib/queries";
import { Countdown } from "@/components/event/countdown";
import { SiteHeader } from "@/components/event/site-header";

type Params = { params: Promise<{ slug: string }> };

const IST = "Asia/Kolkata";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: IST }).format(d);
const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST }).format(d);
const rupees = (paise: number) => (paise / 100).toLocaleString("en-IN");
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound(); // hard 404 (not a soft-404 with 200 status) for unknown/removed events
  const seo = (event.seo as { en?: { title?: string; description?: string } } | null)?.en ?? {};
  return {
    title: seo.title ?? event.title,
    description: seo.description,
    alternates: { canonical: `/e/${slug}` },
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const c = (event.contentJson as EventContent | null) ?? {};
  const intro = (event.description as { en?: string } | null)?.en ?? "";
  const showtime = event.showtimes[0];
  const bandName = event.bands[0]?.band.name ?? "";
  const bandBio = (event.bands[0]?.band.bio as { en?: string } | null)?.en ?? "";
  const members = event.bands.flatMap((eb) => eb.band.members);
  const gallery = (event.galleryJson as string[] | null) ?? [];
  const memberAccents = ["#ff8c00", "#00ced1", "#ff1493", "#f9d464", "#00acee", "#8a5cff", "#2ecc71", "#e0529c"];

  const metaLine = showtime
    ? `${fmtDate(showtime.startsAt)} | ${fmtTime(showtime.startsAt)} Onwards | ${event.venue?.name ?? ""}, ${event.city.name}`
    : `${event.venue?.name ?? ""}, ${event.city.name}`;

  // Interim external ticketing (until Razorpay): CTAs scroll to the tickets section,
  // where each tier links out to its booking page. Flip event.ticketingMode to switch.
  const external = event.ticketingMode === "external";
  const ctaHref = external ? "#tickets" : `/e/${event.slug}/seats`;
  const cta = c.ctaLabel ?? "Book Your Passes";
  const bulk = c.bulkPasses;
  const bulkUrl = bulk?.donateUrl ?? "";

  return (
    <>
      {/* Header — fixed, scroll-aware */}
      <SiteHeader cta={cta} ctaHref={ctaHref} />

      {/* Hero */}
      <section
        className="relative flex min-h-screen items-center justify-center px-6 pb-12 pt-24 text-center"
        style={{
          background: `linear-gradient(135deg, rgba(29,5,65,.72), rgba(29,5,65,.6) 50%, rgba(29,5,65,.5)), url(${event.heroMediaUrl}) center/cover no-repeat`,
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          {(c.heroLogos?.aol || c.heroLogos?.wafc) && (
            <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
              {c.heroLogos?.aol && <img src={c.heroLogos.aol} alt="Art of Living" className="h-9 w-auto object-contain sm:h-11" />}
              {c.heroLogos?.wafc && <img src={c.heroLogos.wafc} alt="World Forum for Art & Culture" className="h-9 w-auto rounded-lg bg-white/90 p-1.5 object-contain sm:h-11" />}
            </div>
          )}
          {c.presents && (
            <p className="mb-1.5 text-[0.65rem] font-light uppercase tracking-[0.35em] text-white/80">presents</p>
          )}
          {/* Platform brand */}
          <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.5)] sm:text-3xl">
            Sattvik&nbsp;<span className="text-orange">Beats</span>
          </p>
          {/* Event logo */}
          {c.heroLogos?.event && (
            <img src={c.heroLogos.event} alt={event.title} className="mt-2.5 w-20 max-w-[28%] drop-shadow-[0_0_12px_rgba(0,0,0,0.4)] sm:w-24" />
          )}
          {/* Campaign headline */}
          {c.headline && (
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] text-white drop-shadow-[0_0_16px_rgba(0,0,0,0.45)] sm:text-5xl">
              {c.headline}
            </h1>
          )}
          {c.heroTags && (
            <p className="mt-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-orange sm:text-sm">{c.heroTags}</p>
          )}
          <p className="mt-3.5 text-sm font-medium tracking-wide text-white/90">{metaLine}</p>
          {c.heroAccent && <p className="mt-2.5 font-display text-base font-bold text-white sm:text-lg">{c.heroAccent}</p>}
          {showtime && <div className="mt-5"><Countdown target={showtime.startsAt.toISOString()} /></div>}
          <a href={ctaHref} className="mt-6 inline-flex rounded-full bg-gradient-to-br from-orange to-orange-2 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5">
            {cta}
          </a>
        </div>
      </section>

      {/* About — More Than a Concert */}
      <section className="bg-cream px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
          <div className="relative mx-auto">
            {c.about?.image && (
              <div className="aspect-square w-[min(420px,90vw)] overflow-hidden rounded-full shadow-2xl">
                <img src={c.about.image} alt={event.title} className="h-full w-full object-cover" />
              </div>
            )}
            {c.about?.video && (
              <a
                href={c.about.video}
                target="_blank"
                rel="noopener"
                aria-label="Play video"
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-2 pl-1 text-white shadow-xl"
              >
                <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
              </a>
            )}
          </div>
          <div className="text-center md:text-left">
            {c.tagline && <h2 className="font-display text-4xl font-bold text-ink sm:text-5xl">{c.tagline}</h2>}
            {intro && <p className="mt-5 leading-8 text-muted">{intro}</p>}
          </div>
        </div>
      </section>

      {/* Highlights — What Awaits You */}
      {c.highlights?.items && c.highlights.items.length > 0 && (
        <section className="bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-4xl font-bold text-ink sm:text-5xl">{c.highlights.heading ?? "What Awaits You"}</h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.highlights.items.map((it) => {
                const sp = it.indexOf(" ");
                const emoji = sp > 0 ? it.slice(0, sp) : "";
                const label = sp > 0 ? it.slice(sp + 1) : it;
                return (
                  <div key={it} className="flex items-center gap-4 rounded-2xl bg-cream p-6 shadow ring-1 ring-black/5">
                    <span className="text-2xl" aria-hidden>{emoji}</span>
                    <span className="font-display text-lg font-semibold text-ink">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Counter */}
      {c.stats && (
        <section className="bg-gradient-to-br from-purple-deep to-primary px-6 py-20">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
            {c.stats.map((s) => (
              <div key={s.label}>
                <span className="block bg-gradient-to-br from-orange to-magenta bg-clip-text font-display text-5xl font-extrabold text-transparent">
                  {s.value.toLocaleString("en-IN")}{s.suffix ?? ""}
                </span>
                <p className="mt-2 font-medium text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Impact — Your Ticket Creates Change */}
      {c.impact && (
        <section className="bg-cream px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-4xl font-bold text-ink sm:text-5xl">{c.impact.heading}</h2>
            {c.impact.body && <p className="mx-auto mt-5 max-w-2xl leading-8 text-muted">{c.impact.body}</p>}
            {c.impact.items && (
              <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
                {c.impact.items.map((it) => (
                  <div key={it} className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-left shadow ring-1 ring-black/5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
                    </span>
                    <span className="font-semibold text-ink">{it}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experience — Feel the Energy */}
      {c.experience && (
        <section className="bg-gradient-to-br from-primary via-purple to-purple-deep px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">{c.experience.heading}</h2>
            {c.experience.body && <p className="mt-6 text-lg leading-8 text-white/85">{c.experience.body}</p>}
          </div>
        </section>
      )}

      {/* Band */}
      {members.length > 0 && (
        <section id="band" className="bg-gradient-to-br from-purple-deep via-purple to-purple-deep px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">Meet {bandName}</h2>
            {bandBio && <p className="mx-auto mt-6 max-w-3xl text-center leading-8 text-white/75">{bandBio}</p>}
            <div className="mt-14 grid grid-cols-2 justify-items-center gap-x-6 gap-y-12 md:grid-cols-4">
              {members.map((m, i) => {
                const accent = memberAccents[i % memberAccents.length];
                return (
                  <figure key={m.id} className="text-center">
                    <div
                      className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full sm:h-40 sm:w-40"
                      style={{ boxShadow: `0 0 0 3px ${accent}, 0 18px 40px -20px rgba(0,0,0,.6)`, background: `linear-gradient(135deg, ${accent}55, ${accent}22)` }}
                    >
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">{initials(m.name)}</span>
                      )}
                    </div>
                    <figcaption className="mt-4">
                      <span className="block font-display text-lg font-bold text-white">{m.name}</span>
                      {m.role && <span className="block text-sm text-white/60">{m.role}</span>}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tickets */}
      <section id="tickets" className="bg-gradient-to-br from-primary to-purple-deep px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">{c.ticketsHeading ?? "Choose Your Pass"}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/60">
            {c.ticketsSubtext ?? (external ? "Choose your category and reserve your spot." : "Secure your spot — pick a premium seat or a general-admission pass below.")}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {event.categories.map((cat, i) => (
              <div key={cat.id} className={`relative flex flex-col rounded-2xl bg-white p-7 ${c.ticketBadges?.[cat.name] ? "shadow-2xl shadow-magenta/50 ring-2 ring-magenta" : i === event.categories.length - 1 ? "shadow-xl ring-2 ring-orange" : "shadow-xl"}`}>
                {c.ticketBadges?.[cat.name] && (
                  <span className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-magenta to-orange-2 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-magenta/40">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
                    {c.ticketBadges[cat.name]}
                  </span>
                )}
                <h3 className="text-center font-display text-xl font-bold text-purple">{cat.name}</h3>
                <div className="mt-3 text-center font-display text-4xl font-extrabold text-ink">
                  <sup className="top-[-0.9rem] text-xl">₹</sup>{rupees(cat.basePrice)}
                </div>
                <p className="mt-5 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  {c.admissionLabels?.[cat.name] ?? (cat.admission === "general" ? "General admission" : "Reserved seat")}
                </p>
                {c.ticketPerks?.[cat.name] && (
                  <p className="mt-2 text-center text-[0.72rem] font-bold leading-4 text-orange-2">{c.ticketPerks[cat.name]}</p>
                )}
                {external && cat.bookingUrl && (
                  <div className="mt-auto pt-6">
                    <a href={cat.bookingUrl} target="_blank" rel="noopener" className="block rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-2.5 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5">Book Now →</a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Premium perk — Sudarshan Kriya / Happiness Program */}
          {c.happinessProgram && (
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white/[0.06] p-8 ring-1 ring-orange/40">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-2xl" aria-hidden>🧘</span>
                <h3 className="text-center font-display text-2xl font-bold text-white">{c.happinessProgram.heading}</h3>
              </div>
              {c.happinessProgram.body && <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-white/80">{c.happinessProgram.body}</p>}
              {c.happinessProgram.points && c.happinessProgram.points.length > 0 && (
                <ul className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {c.happinessProgram.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 rounded-xl bg-white/5 p-4 text-left">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-2 text-white">
                        <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
                      </span>
                      <span className="text-sm leading-5 text-white/85">{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Group / bulk passes — booked via the donation link (choose "Other Amount") */}
          {bulk?.bundles && bulk.bundles.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl rounded-2xl bg-white/[0.06] p-8 ring-1 ring-white/10">
              <h3 className="text-center font-display text-2xl font-bold text-white">{bulk.heading ?? "Booking for a Group?"}</h3>
              {bulk.intro && <p className="mx-auto mt-2 max-w-xl text-center text-sm text-white/60">{bulk.intro}</p>}
              {bulk.steps && bulk.steps.length > 0 && (
                <ol className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
                  {bulk.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">{i + 1}</span>
                      <span className="text-xs leading-5 text-white/80">{s}</span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {bulk.bundles.map((b) => (
                  <a key={b.label} href={bulkUrl} target="_blank" rel="noopener" className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow transition-transform hover:-translate-y-0.5">
                    <span className="font-display text-base font-bold text-purple">{b.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-display text-lg font-extrabold text-ink">{b.amount}</span>
                      <span className="font-bold text-orange">→</span>
                    </span>
                  </a>
                ))}
              </div>
              {bulk.note && <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-5 text-white/50">{bulk.note}</p>}
            </div>
          )}

          {!external && (
            <div className="mt-10 text-center">
              <a href={`/e/${event.slug}/seats`} className="inline-flex rounded-full bg-gradient-to-br from-orange to-orange-2 px-9 py-4 text-base font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5">
                Select your seats →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Quote */}
      {c.quote?.lines && c.quote.lines.length > 0 && (
        <section className="bg-cream px-6 py-24">
          <figure className="mx-auto max-w-3xl text-center">
            <svg viewBox="0 0 24 24" width="40" height="40" className="mx-auto text-orange" aria-hidden><path fill="currentColor" d="M7 7h4v4H9c0 2 1 3 2 3v2c-3 0-4-2-4-5V7zm8 0h4v4h-2c0 2 1 3 2 3v2c-3 0-4-2-4-5V7z" /></svg>
            <blockquote className="mt-6 font-display text-2xl font-semibold leading-relaxed text-ink sm:text-3xl">
              {c.quote.lines.map((line, i) => <span key={i} className="block">{line}</span>)}
            </blockquote>
            {c.quote.author && <figcaption className="mt-6 text-sm font-semibold uppercase tracking-widest text-orange">— {c.quote.author}</figcaption>}
          </figure>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4">
          {gallery.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden">
              <img src={src} alt="Gallery" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
            </div>
          ))}
        </section>
      )}

      {/* FAQ */}
      {c.faqs && (
        <section id="faq" className="bg-cream px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-4xl font-bold text-orange sm:text-5xl">Frequently Asked Questions</h2>
            <div className="mt-12 divide-y divide-black/10">
              {c.faqs.map((f, i) => (
                <details key={i} className="group py-2" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-lg font-bold text-ink [&::-webkit-details-marker]:hidden group-open:text-cyan">
                    {f.q}
                    <span className="ml-4 inline-block h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-orange transition-transform group-open:rotate-[-135deg] group-open:border-cyan" />
                  </summary>
                  <p className="pb-5 text-[0.95rem] leading-7 text-ink/80">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners */}
      {event.partners.length > 0 && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Our Partners</h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {event.partners.map((p) => {
                const inner = (
                  <>
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt={p.name} className="mx-auto h-12 object-contain" />
                    ) : (
                      <span className="font-display text-2xl font-bold text-ink">{p.name}</span>
                    )}
                    {p.tier && <span className="mt-1 block text-xs uppercase tracking-wider text-muted">{p.tier}</span>}
                  </>
                );
                return p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener" className="block">{inner}</a>
                ) : (
                  <div key={p.id}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="bg-gradient-to-br from-primary to-purple-deep px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">Get In Touch</h2>
          <div className="mt-12 grid gap-8 text-center sm:grid-cols-3">
            {c.contact?.phone && (
              <div className="text-white">
                <p className="font-display text-xl font-bold">Call Us</p>
                <a href={`tel:${c.contact.phone.replace(/\s/g, "")}`} className="mt-1 block text-white/85">{c.contact.phone}</a>
                {c.contact.phoneLabel && <p className="text-white/60">{c.contact.phoneLabel}</p>}
              </div>
            )}
            <div className="text-white">
              <p className="font-display text-xl font-bold">Venue</p>
              <p className="mt-1 text-white/85">{event.venue?.name}</p>
              <p className="text-white/60">{event.venue?.address}</p>
            </div>
            {c.contact?.instagram && (
              <div className="text-white">
                <p className="font-display text-xl font-bold">Follow Us</p>
                <a href={c.contact.instagram} target="_blank" rel="noopener" className="mt-1 block text-white/85">
                  {c.contact.instagramHandle ?? "Instagram"}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {c.finalCta && (
        <section className="bg-gradient-to-br from-orange via-magenta to-orange-2 px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-4xl font-extrabold text-white drop-shadow sm:text-5xl">{c.finalCta.heading}</h2>
            {c.finalCta.body && <p className="mt-5 text-lg leading-8 text-white/90">{c.finalCta.body}</p>}
            <a href={ctaHref} className="mt-9 inline-flex rounded-full bg-white px-9 py-4 text-base font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5">
              {c.finalCta.label ?? cta}
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-purple-deep px-6 py-14 text-white/75">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Event Details</h3>
            <p className="mt-3 font-semibold text-orange">{metaLine}</p>
            <p className="mt-2 text-white/70">{event.venue?.address}</p>
            {c.trustUrl && (
              <a href={c.trustUrl} target="_blank" rel="noopener" className="mt-6 inline-flex rounded-full border-2 border-white/30 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-orange hover:text-orange">
                Support AOL Trust →
              </a>
            )}
          </div>
          {event.venue?.mapsEmbed && (
            <iframe src={event.venue.mapsEmbed} className="h-64 w-full rounded-2xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={event.venue.name} />
          )}
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-sm text-white/50">
          © 2026 Sattvik Beats · {event.title}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
