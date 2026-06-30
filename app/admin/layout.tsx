import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { getStaff } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard", super: false },
  { href: "/admin/analytics", label: "Analytics", super: false },
  { href: "/admin/events", label: "Events", super: false },
  { href: "/admin/orders", label: "Orders", super: false },
  { href: "/admin/cities", label: "Cities", super: true },
  { href: "/admin/venues", label: "Venues", super: true },
  { href: "/admin/bands", label: "Bands", super: true },
];

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  const staff = await getStaff();

  if (!staff?.isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Not authorized</h1>
          <p className="mt-2 text-muted">{session.user.phone} doesn’t have admin access.</p>
          <form action={logout} className="mt-6">
            <button className="text-sm font-semibold text-orange-2 hover:underline">Log out</button>
          </form>
        </div>
      </div>
    );
  }

  const nav = NAV.filter((n) => staff.isSuper || !n.super);

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <aside className="flex w-56 shrink-0 flex-col bg-primary p-5 text-white">
        <Link href="/admin" className="font-display text-lg font-extrabold tracking-wide">
          SATTVICK <span className="text-orange">ADMIN</span>
        </Link>
        <p className="mt-1 text-xs text-white/50">{staff.isSuper ? "Super Admin" : "City Admin"}</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 font-medium text-white/80 hover:bg-white/10 hover:text-white">{n.label}</Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 text-xs text-white/50">
          <p className="truncate">{staff.phone}</p>
          <form action={logout}><button className="mt-1 hover:text-white">Log out</button></form>
          <Link href="/" className="mt-2 block hover:text-white">← View site</Link>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
