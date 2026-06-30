import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/bands", label: "Bands" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <aside className="w-56 shrink-0 bg-primary p-5 text-white">
        <Link href="/admin" className="font-display text-lg font-extrabold tracking-wide">
          SATTVICK <span className="text-orange">ADMIN</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-8 block text-xs text-white/50 hover:text-white">
          ← View site
        </Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
