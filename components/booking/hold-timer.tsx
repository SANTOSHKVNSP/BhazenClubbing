"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      setLeft(ms);
      if (ms <= 0) router.refresh();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [end, router]);

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={left <= 30000 ? "text-orange" : ""}>
      {left <= 0 ? "expired" : `${m}:${String(s).padStart(2, "0")}`}
    </span>
  );
}
