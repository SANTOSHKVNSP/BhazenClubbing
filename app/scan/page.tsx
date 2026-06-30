import { prisma } from "@/lib/db";
import { Scanner } from "@/components/scan/scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const showtimes = await prisma.showtime.findMany({
    where: { status: "live" },
    include: { event: true },
    orderBy: { startsAt: "asc" },
  });
  return (
    <Scanner
      showtimes={showtimes.map((s) => ({
        id: s.id,
        label: `${s.event.title} — ${new Date(s.startsAt).toISOString().slice(0, 16).replace("T", " ")}`,
      }))}
    />
  );
}
