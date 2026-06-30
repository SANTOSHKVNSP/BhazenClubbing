import Link from "next/link";
import { adminListEvents } from "@/lib/admin/queries";
import { deleteEvent } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function EventsList() {
  const events = await adminListEvents();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Events</h1>
        <Link href="/admin/events/new" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-5 py-2.5 text-sm font-bold text-white">
          + New event
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Title</th><th className="p-3">City</th><th className="p-3">Status</th><th className="p-3">Showtimes</th><th className="p-3" /><th className="p-3" /></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-black/5">
                <td className="p-3 font-medium"><Link href={`/admin/events/${e.id}`} className="hover:text-orange">{e.title}</Link></td>
                <td className="p-3 text-muted">{e.city.name}</td>
                <td className="p-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{e.status}</span></td>
                <td className="p-3 text-muted">{e._count.showtimes}</td>
                <td className="p-3 text-muted">{e.status === "live" && <a href={`/e/${e.slug}`} target="_blank" className="text-xs text-orange-2 hover:underline">View ↗</a>}</td>
                <td className="p-3 text-right"><form action={deleteEvent}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-red-600 hover:underline">Delete</button></form></td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
