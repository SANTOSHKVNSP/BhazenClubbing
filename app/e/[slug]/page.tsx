import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventBySlug, type EventContent } from "@/lib/queries";
import { Countdown } from "@/components/event/countdown";

type Params = { params: Promise<{ slug: string }> };

const IST = "Asia/Kolkata";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: IST }).format(d);
const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST }).format(d);
const rupees = (paise: number) => (paise / 100).toLocaleString("en-IN");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const seo = (event.seo as { en?: { title?: string; description?: string } } | null)?.en ?? {};
  return { title: seo.title ?? event.title, description: seo.description };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const c = (event.contentJson as EventContent | null) ?? {};
  const intro = (event.description as { en?: string } | null)?.en ?? "";
  const showtime = event.showtimes[0];
  const members = event.bands.flatMap((eb) => eb.band.members);
  const gallery = (event.galleryJson as string[] | null) ?? [];
  const memberAccents = ["#ff8c00", "#00ced1", "#ff1493", "#f9d464", "#00acee", "#8a5cff"];

  const metaLine = showtime
    ? `${fmtDate(showtime.startsAt)} | ${fmtTime(showtime.startsAt)} Onwards | ${event.venue?.name ?? ""}, ${event.city.name}`
    : `${event.venue?.name ?? ""}, ${event.city.name}`;

  return (
    <>
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-xl font-extrabold tracking-wide text-white">
            SATTVIK&nbsp;<span className="text-orange">BEATS</span>
          </Link>
          <a href={`/e/${event.slug}/seats`} className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange/40">
            Reserve Your Spot
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative flex min-h-screen items-center justify-center px-6 py-32 text-center"
        style={{
          background: `linear-gradient(135deg, rgba(29,5,65,.6), rgba(29,5,65,.5) 50%, rgba(29,5,65,.4)), url(${event.heroMediaUrl}) center/cover no-repeat`,
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          {(c.heroLogos?.aol || c.heroLogos?.wafc) && (
            <div className="mb-4 flex flex-wrap items-center justify-center gap-5">
              {c.heroLogos?.aol && <img src={c.heroLogos.aol} alt="Art of Living" className="h-14 w-auto object-contain sm:h-16" />}
              {c.heroLogos?.wafc && <img src={c.heroLogos.wafc} alt="World Forum for Art & Culture" className="h-14 w-auto rounded-lg bg-white/90 p-2 object-contain sm:h-16" />}
            </div>
          )}
          {c.presents && (
            <p className="mb-4 text-sm font-light uppercase tracking-[0.35em] text-white/80">presents</p>
          )}
          {/* Platform brand — primary */}
          <p className="font-display text-6xl font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.5)] sm:text-7xl">
            Sattvik&nbsp;<span className="text-orange">Beats</span>
          </p>
          {/* Event logo — subheading */}
          {c.heroLogos?.event && (
            <img src={c.heroLogos.event} alt={event.title} className="mt-5 mb-6 w-40 max-w-[45%] drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]" />
          )}
          <p className="mb-9 text-sm font-medium tracking-wide text-white/90 sm:text-base">{metaLine}</p>
          {showtime && <Countdown target={showtime.startsAt.toISOString()} />}
          <a href={`/e/${event.slug}/seats`} className="mt-10 inline-flex rounded-full bg-gradient-to-br from-orange to-orange-2 px-9 py-4 text-base font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5">
            Reserve Your Spot
          </a>
        </div>
      </section>

      {/* About */}
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
            <p className="mt-5 text-muted">{intro}</p>
            {c.features && (
              <ul className="mt-7 flex flex-wrap justify-center gap-4 md:justify-start">
                {c.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow ring-1 ring-black/5">
                    <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange to-magenta" />
                    <span className="font-display text-lg font-semibold text-ink">{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

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

      {/* Band */}
      {members.length > 0 && (
        <section id="band" className="bg-gradient-to-br from-purple-deep via-purple to-purple-deep px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">
              Meet {event.bands[0]?.band.name}
            </h2>
            <div className="mt-14 grid grid-cols-2 justify-items-center gap-x-6 gap-y-12 md:grid-cols-3">
              {members.map((m, i) => (
                <figure key={m.id} className="text-center">
                  <div
                    className="mx-auto h-40 w-40 overflow-hidden rounded-full p-1.5 sm:h-48 sm:w-48"
                    style={{ boxShadow: `0 0 0 3px ${memberAccents[i % memberAccents.length]}, 0 18px 40px -20px rgba(0,0,0,.6)` }}
                  >
                    {m.photoUrl && <img src={m.photoUrl} alt={m.role ?? m.name} className="h-full w-full rounded-full object-cover" />}
                  </div>
                  <figcaption className="mt-4">
                    <span className="block font-display text-xl font-bold text-white">{m.role ?? m.name}</span>
                    <span className="block text-sm text-white/60">{event.bands[0]?.band.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tickets */}
      <section id="tickets" className="bg-gradient-to-br from-primary to-purple-deep px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">Reserve Your Spot</h2>
          <p className="mt-3 text-center text-sm text-white/60">Secure your spot — pick a premium seat or a general-admission pass below.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {event.categories.map((cat, i) => (
              <div key={cat.id} className={`rounded-2xl bg-white p-8 shadow-xl ${i === event.categories.length - 1 ? "ring-2 ring-orange" : ""}`}>
                <h3 className="text-center font-display text-2xl font-bold text-purple">{cat.name}</h3>
                <div className="mt-3 text-center font-display text-5xl font-extrabold text-ink">
                  <sup className="top-[-1.1rem] text-2xl">₹</sup>{rupees(cat.basePrice)}
                </div>
                <p className="mt-6 text-center text-xs font-semibold uppercase tracking-wide text-muted">{cat.admission === "general" ? "General admission" : "Reserved seat"}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href={`/e/${event.slug}/seats`} className="inline-flex rounded-full bg-gradient-to-br from-orange to-orange-2 px-9 py-4 text-base font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5">
              Select your seats →
            </a>
          </div>
        </div>
      </section>

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
