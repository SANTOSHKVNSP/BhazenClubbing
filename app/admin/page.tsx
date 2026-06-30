import Link from "next/link";
import { adminStats } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const s = await adminStats();
  const cards = [
    { label: "Events", value: s.events, sub: `${s.live} live`, href: "/admin/events" },
    { label: "Cities", value: s.cities, href: "/admin/cities" },
    { label: "Venues", value: s.venues, href: "/admin/venues" },
    { label: "Bands", value: s.bands, href: "/admin/bands" },
  ];
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-orange"
          >
            <p className="text-sm font-semibold text-muted">{c.label}</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-ink">{c.value}</p>
            {c.sub && <p className="text-xs font-semibold text-orange-2">{c.sub}</p>}
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Manage events, review orders, and track sales from the menu. City admins see only their city.
      </p>
    </>
  );
}
