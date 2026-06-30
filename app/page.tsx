import { getTranslations } from "next-intl/server";
import { listLiveEvents } from "@/lib/queries";
import { EventCard } from "@/components/event/event-card";

// Reflect content/admin changes without a rebuild (revisit caching in Phase 6).
export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getTranslations("Landing");
  const events = await listLiveEvents();

  return (
    <>
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-2xl font-extrabold tracking-wide text-white">
            SATTVICK&nbsp;<span className="text-orange">BEATS</span>
          </span>
          <nav className="hidden gap-8 text-sm font-semibold text-white/90 sm:flex">
            <a href="#events" className="hover:text-orange">{t("nav.events")}</a>
            <a href="#about" className="hover:text-orange">{t("nav.about")}</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[88vh] items-center justify-center bg-gradient-to-br from-primary via-purple to-purple-deep px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.35em] text-white/70">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-white sm:text-7xl">
            {t("hero.titleLead")}{" "}
            <span className="bg-gradient-to-r from-orange to-magenta bg-clip-text text-transparent">
              {t("hero.titleAccent")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">{t("hero.subtitle")}</p>
          <div className="mt-10">
            <a
              href="#events"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-2 px-9 py-4 text-base font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5"
            >
              {t("hero.cta")}
            </a>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="bg-cream px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-4xl font-bold text-ink">{t("events.heading")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">{t("events.subtitle")}</p>

          {events.length > 0 ? (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-muted">No events on sale right now — check back soon.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="mt-auto bg-purple-deep px-6 py-10 text-center text-sm text-white/70">
        <p className="font-display text-lg font-bold tracking-wide text-white">SATTVICK BEATS</p>
        <p className="mt-2">{t("footer.tagline")}</p>
        <p className="mt-4 text-white/50">{t("footer.rights")}</p>
      </footer>
    </>
  );
}
