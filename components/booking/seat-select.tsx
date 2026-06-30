"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ShowtimeSeating } from "@/lib/booking/seating";
import { reserveSeats } from "@/lib/booking/actions";

const MAX = 10;
const rupees = (p: number) => (p / 100).toLocaleString("en-IN");

export function SeatSelect({ seating, slug }: { seating: ShowtimeSeating; slug: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const colorByCat = useMemo(
    () => new Map(seating.categories.map((c) => [c.name, c.color ?? "#888888"])),
    [seating]
  );
  const seatIndex = useMemo(() => {
    const m = new Map<string, { category: string; label: string }>();
    for (const sec of seating.sections)
      for (const row of sec.rows)
        for (const s of row.seats) m.set(s.id, { category: s.category, label: `${row.label}${s.number}` });
    return m;
  }, [seating]);
  const priceByCat = useMemo(
    () => new Map(seating.categories.map((c) => [c.name, c.price])),
    [seating]
  );

  const selectedIds = [...selected];
  const total = selectedIds.reduce((sum, id) => sum + (priceByCat.get(seatIndex.get(id)!.category) ?? 0), 0);

  function toggle(id: string, status: string) {
    if (status !== "available") return;
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX) next.add(id);
      else setError(`You can select up to ${MAX} seats.`);
      return next;
    });
  }

  function reserve() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const res = await reserveSeats({ showtimeId: seating.showtimeId, slug, seatIds: selectedIds });
      if (res?.error) {
        setError(res.error);
        setSelected(new Set());
        router.refresh(); // refresh availability
      }
    });
  }

  return (
    <div className="pb-28">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/80">
        {seating.categories.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ background: c.color ?? "#888" }} />
            {c.name} · ₹{rupees(c.price)}
          </span>
        ))}
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-white ring-2 ring-ink" /> Selected</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-neutral-500" /> Taken</span>
      </div>

      {/* Stage */}
      <div className="mx-auto mt-8 max-w-xl rounded-t-[50%] border-x border-t border-white/30 bg-white/5 py-2 text-center text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
        Stage
      </div>

      {/* Seat map */}
      <div className="mt-8 overflow-x-auto">
        <div className="mx-auto w-max space-y-6">
          {seating.sections.map((sec) => (
            <div key={sec.id}>
              {seating.sections.length > 1 && (
                <p className="mb-2 text-center text-sm font-semibold text-white/70">{sec.label}</p>
              )}
              <div className="space-y-1.5">
                {sec.rows.map((row) => (
                  <div key={row.label} className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-white/40">{row.label}</span>
                    {row.seats.map((s) => {
                      const isSel = selected.has(s.id);
                      const taken = s.status === "sold" || s.status === "held";
                      if (s.status === "blocked") return <span key={s.id} className="h-6 w-6" />;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          title={`${row.label}${s.number} · ${s.category} · ₹${rupees(priceByCat.get(s.category) ?? 0)}`}
                          onClick={() => toggle(s.id, s.status)}
                          disabled={taken}
                          className={`h-6 w-6 rounded text-[9px] font-bold transition ${
                            taken
                              ? "cursor-not-allowed bg-neutral-600 text-neutral-500"
                              : isSel
                                ? "scale-110 bg-white text-ink ring-2 ring-ink"
                                : "text-white/90 hover:scale-110"
                          }`}
                          style={!taken && !isSel ? { background: colorByCat.get(s.category) } : undefined}
                        >
                          {s.number}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-purple-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="text-sm text-white/80">
            {selectedIds.length > 0 ? (
              <>
                <span className="font-bold text-white">{selectedIds.length}</span> seat{selectedIds.length > 1 ? "s" : ""} ·{" "}
                <span className="font-bold text-white">₹{rupees(total)}</span>
              </>
            ) : (
              <span>Select your seats</span>
            )}
            {error && <span className="ml-3 text-orange">{error}</span>}
          </div>
          <button
            onClick={reserve}
            disabled={selectedIds.length === 0 || pending}
            className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange/40 disabled:opacity-50"
          >
            {pending ? "Holding…" : "Reserve seats"}
          </button>
        </div>
      </div>
    </div>
  );
}
