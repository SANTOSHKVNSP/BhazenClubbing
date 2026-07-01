import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug } from "@/lib/queries";
import { EventCard } from "@/components/event/event-card";

type Params = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const c = await getCityBySlug(city);
  if (!c) return {};
  const seo = (c.seo as { en?: { title?: string; description?: string } } | null)?.en ?? {};
  return {
    title: seo.title ?? `${c.name} — Sattvik Beats`,
    description: seo.description,
  };
}

export default async function CityPage({ params }: Params) {
  const { city } = await params;
  const c = await getCityBySlug(city);
  if (!c) notFound();

  return (
    <>
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-wide text-white">
            SATTVIK&nbsp;<span className="text-orange">BEATS</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex min-h-[40vh] items-center justify-center bg-gradient-to-br from-primary via-purple to-purple-deep px-6 pt-24 text-center">
        <div>
          <p className="text-sm font-light uppercase tracking-[0.35em] text-white/70">Sattvik Beats in</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold text-white sm:text-6xl">{c.name}</h1>
          {c.state && <p className="mt-2 text-white/70">{c.state}</p>}
        </div>
      </section>

      {/* Events */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {c.events.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {c.events.map((event) => (
                <EventCard key={event.id} event={{ ...event, city: { name: c.name } }} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No live events in {c.name} right now.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-purple-deep px-6 py-10 text-center text-sm text-white/70">
        <p className="font-display text-lg font-bold tracking-wide text-white">SATTVIK BEATS</p>
        <p className="mt-4 text-white/50">© 2026 Sattvik Beats. All rights reserved.</p>
      </footer>
    </>
  );
}
