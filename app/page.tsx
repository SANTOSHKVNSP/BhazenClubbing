// Phase 0 placeholder — national landing shell proving the design system + i18n.
// Real city/event content arrives in Phase 1 (see docs/IMPLEMENTATION_TRACKER.md).
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Landing");

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
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            {t("hero.subtitle")}
          </p>
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

      {/* Events teaser */}
      <section id="events" className="bg-cream px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-4xl font-bold text-ink">
            {t("events.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            {t("events.subtitle")}
          </p>

          <div className="mx-auto mt-12 grid max-w-md gap-6">
            <article className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary to-purple-deep">
                <span className="font-display text-3xl font-extrabold text-white">
                  BhaZen Clubbing
                </span>
              </div>
              <div className="p-6">
                <span className="inline-block rounded-full bg-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-2">
                  {t("events.comingSoon")}
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold text-ink">
                  {t("events.eventTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted">{t("events.eventVenue")}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="mt-auto bg-purple-deep px-6 py-10 text-center text-sm text-white/70">
        <p className="font-display text-lg font-bold tracking-wide text-white">
          SATTVICK BEATS
        </p>
        <p className="mt-2">{t("footer.tagline")}</p>
        <p className="mt-4 text-white/50">{t("footer.rights")}</p>
      </footer>
    </>
  );
}
