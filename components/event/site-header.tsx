"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Fixed, scroll-aware header: transparent over the hero, solid blurred bar once
// scrolled so the CTA stays visible and readable over light sections.
export function SiteHeader({ cta, ctaHref }: { cta: string; ctaHref: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
        scrolled ? "bg-primary/90 shadow-lg shadow-black/20 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-extrabold tracking-wide text-white">
          SATTVIK&nbsp;<span className="text-orange">BEATS</span>
        </Link>
        <a
          href={ctaHref}
          className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange/40 transition-transform hover:-translate-y-0.5"
        >
          {cta}
        </a>
      </div>
    </header>
  );
}
