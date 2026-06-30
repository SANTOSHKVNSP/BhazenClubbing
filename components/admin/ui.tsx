import type { ComponentProps, ReactNode } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-orange";

export function Field({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input {...props} className={inputCls} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & ComponentProps<"textarea">) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea {...props} className={`${inputCls} font-mono text-xs`} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & ComponentProps<"select">) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select {...props} className={inputCls}>
        {children}
      </select>
    </label>
  );
}

export function Submit({ children = "Save" }: { children?: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-6 py-2.5 text-sm font-bold text-white"
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-5 shadow-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
