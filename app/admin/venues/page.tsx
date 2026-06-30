import Link from "next/link";
import { adminListVenues } from "@/lib/admin/queries";
import { deleteVenue } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function VenuesList() {
  const venues = await adminListVenues();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Venues</h1>
        <Link href="/admin/venues/new" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-5 py-2.5 text-sm font-bold text-white">
          + New venue
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">City</th><th className="p-3">Template</th><th className="p-3">Capacity</th><th className="p-3">Events</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} className="border-t border-black/5">
                <td className="p-3 font-medium"><Link href={`/admin/venues/${v.id}`} className="hover:text-orange">{v.name}</Link></td>
                <td className="p-3 text-muted">{v.city.name}</td>
                <td className="p-3 text-muted">{v.template}</td>
                <td className="p-3 text-muted">{v.capacity}</td>
                <td className="p-3 text-muted">{v._count.events}</td>
                <td className="p-3 text-right"><form action={deleteVenue}><input type="hidden" name="id" value={v.id} /><button className="text-xs text-red-600 hover:underline">Delete</button></form></td>
              </tr>
            ))}
            {venues.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No venues yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
