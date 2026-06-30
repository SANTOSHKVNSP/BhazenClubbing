import { NextResponse } from "next/server";
import { getStaff } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET() {
  const staff = await getStaff();
  if (!staff?.isStaff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: staff.isSuper ? {} : { showtime: { event: { cityId: { in: staff.cityIds } } } },
    include: { user: true, showtime: { include: { event: true } }, invoice: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Order", "Invoice", "Event", "Customer", "Tickets", "Subtotal", "Fee", "GST", "Total", "Status", "Created"];
  const rows = orders.map((o) => [
    o.id, o.invoice?.number ?? "", o.showtime.event.title, o.user.phone, o._count.tickets,
    o.subtotal / 100, o.fee / 100, o.gst / 100, o.total / 100, o.status, o.createdAt.toISOString(),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"' },
  });
}
