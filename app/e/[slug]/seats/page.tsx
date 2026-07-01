import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventBySlug } from "@/lib/queries";
import { getShowtimeSeating } from "@/lib/booking/seating";
import { SeatSelect } from "@/components/booking/seat-select";

export const dynamic = "force-dynamic";

export default async function SeatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const showtime = event.showtimes[0];
  const seating = showtime ? await getShowtimeSeating(showtime.id) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary to-purple-deep px-6 pb-10 pt-10">
      <div className="mx-auto max-w-5xl">
        <Link href={`/e/${slug}`} className="text-sm text-white/60 hover:text-white">
          ← Back to {event.title}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Choose your tickets</h1>
        <p className="mt-1 text-sm text-white/60">
          {event.title} · {event.city.name}
          {seating ? ` · ${seating.available} available` : ""}
        </p>

        {seating ? (
          <div className="mt-8">
            <SeatSelect seating={seating} slug={slug} />
          </div>
        ) : (
          <p className="mt-10 rounded-xl bg-white/5 p-6 text-white/70">
            Seat selection isn’t available for this event yet.
          </p>
        )}
      </div>
    </main>
  );
}
