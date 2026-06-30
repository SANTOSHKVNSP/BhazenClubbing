import Link from "next/link";
import { adminListBands } from "@/lib/admin/queries";
import { deleteBand } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function BandsList() {
  const bands = await adminListBands();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Bands</h1>
        <Link href="/admin/bands/new" className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-5 py-2.5 text-sm font-bold text-white">
          + New band
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Members</th><th className="p-3">Events</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.id} className="border-t border-black/5">
                <td className="p-3 font-medium"><Link href={`/admin/bands/${b.id}`} className="hover:text-orange">{b.name}</Link></td>
                <td className="p-3 text-muted">{b.members.length}</td>
                <td className="p-3 text-muted">{b._count.events}</td>
                <td className="p-3 text-right"><form action={deleteBand}><input type="hidden" name="id" value={b.id} /><button className="text-xs text-red-600 hover:underline">Delete</button></form></td>
              </tr>
            ))}
            {bands.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">No bands yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
