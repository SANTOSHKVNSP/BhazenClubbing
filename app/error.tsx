"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary to-purple-deep px-6 text-center text-white">
      <p className="font-display text-5xl font-extrabold text-orange">Oops</p>
      <h1 className="mt-2 font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-white/70">An unexpected error occurred. Please try again.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-3 font-bold text-white">Try again</button>
        <Link href="/" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white">Home</Link>
      </div>
    </main>
  );
}
