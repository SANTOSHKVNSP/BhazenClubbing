"use client";

import { useEffect, useState } from "react";

const ACCENTS = ["#f9d464", "#00acee", "#fc097c", "#554bb9"];
const LABELS = ["Days", "Hours", "Mins", "Secs"];

function parts(target: number): number[] {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return [
    Math.floor(s / 86400),
    Math.floor((s % 86400) / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ];
}

export function Countdown({ target }: { target: string }) {
  const t = new Date(target).getTime();
  // Start at zeros on both server + client (no hydration mismatch); fill on mount.
  const [vals, setVals] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    setVals(parts(t));
    const id = setInterval(() => setVals(parts(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
      {vals.map((v, i) => (
        <div
          key={i}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] border-white/90 bg-white/5 backdrop-blur-sm sm:h-32 sm:w-32"
          style={{ boxShadow: `0 12px 32px -10px ${ACCENTS[i]}` }}
        >
          <span className="font-display text-3xl font-extrabold leading-none text-white sm:text-5xl">
            {String(v).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[0.65rem] uppercase tracking-wider text-white/80 sm:text-xs">
            {LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
