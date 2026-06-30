"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { requestOtp } from "@/lib/auth/actions";

const inputCls =
  "mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-ink outline-none focus:border-orange";

export function LoginForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl") || "/";

  function requestCode(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = await requestOtp(phone);
      if (!r.ok) return setError(r.error);
      setPhone(r.phone);
      setStep("otp");
    });
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const res = await signIn("credentials", { phone, code, redirect: false });
      if (res?.error) setError("Invalid or expired code. Please try again.");
      else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6">
      {step === "phone" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Mobile number</span>
            <input
              className={inputCls}
              inputMode="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Enter the 6-digit code</span>
            <input
              className={`${inputCls} tracking-[0.5em]`}
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <p className="text-xs text-muted">Sent to {phone}. In dev, the code is printed to the server console.</p>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Verify & continue"}
          </button>
          <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-muted hover:text-ink">
            ← Change number
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
