import Link from "next/link";
import { adminListCities } from "@/lib/admin/queries";
import { deleteCity } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function CitiesList() {
  const cities = await adminListCities();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Cities</h1>
        <Link href="/admin/cities/new" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-5 py-2.5 text-sm font-bold text-white">
          + New city
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Status</th><th className="p-3">Events</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} className="border-t border-black/5">
                <td className="p-3 font-medium"><Link href={`/admin/cities/${c.id}`} className="hover:text-orange">{c.name}</Link></td>
                <td className="p-3 text-muted">{c.slug}</td>
                <td className="p-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{c.status}</span></td>
                <td className="p-3 text-muted">{c._count.events}</td>
                <td className="p-3 text-right">
                  <form action={deleteCity}><input type="hidden" name="id" value={c.id} /><button className="text-xs text-red-600 hover:underline">Delete</button></form>
                </td>
              </tr>
            ))}
            {cities.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No cities yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
