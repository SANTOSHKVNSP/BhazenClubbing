import { requireSuper } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const fmt = (d: Date) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

export default async function AuditPage() {
  await requireSuper();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, phone: true } });
  const phone = new Map(users.map((u) => [u.id, u.phone]));

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-muted">Last 100 sensitive actions (approvals, rejections, refunds, comps).</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-black/5 align-top">
                <td className="p-3 whitespace-nowrap text-muted">{fmt(l.createdAt)}</td>
                <td className="p-3 text-muted">{l.actorId ? (phone.get(l.actorId) ?? l.actorId.slice(0, 8)) : "system"}</td>
                <td className="p-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs font-semibold">{l.action}</span></td>
                <td className="p-3 text-muted">{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="p-3 text-xs text-muted">{l.after ? JSON.stringify(l.after) : ""}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
