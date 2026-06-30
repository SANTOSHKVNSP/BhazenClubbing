import Link from "next/link";

const IST = "Asia/Kolkata";
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: IST }).format(d);

type CardEvent = {
  slug: string;
  title: string;
  heroMediaUrl: string | null;
  city: { name: string } | null;
  showtimes: { startsAt: Date }[];
  categories: { basePrice: number }[];
};

export function EventCard({ event }: { event: CardEvent }) {
  const st = event.showtimes?.[0];
  const from = event.categories?.[0]?.basePrice;

  return (
    <Link
      href={`/e/${event.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 transition-transform hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary to-purple-deep">
        {event.heroMediaUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.heroMediaUrl}
            alt={event.title}
            className="h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {event.city && (
          <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {event.city.name}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-bold text-ink">{event.title}</h3>
        {st && <p className="mt-1 text-sm text-muted">{fmt(new Date(st.startsAt))}</p>}
        <div className="mt-4 flex items-center justify-between">
          {from != null && (
            <span className="text-sm font-semibold text-ink">
              From ₹{(from / 100).toLocaleString("en-IN")}
            </span>
          )}
          <span className="text-sm font-bold text-orange-2 group-hover:underline">View event →</span>
        </div>
      </div>
    </Link>
  );
}
