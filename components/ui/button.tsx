import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform disabled:opacity-60 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "px-7 py-3 text-sm",
  lg: "px-9 py-4 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-orange to-orange-2 text-white shadow-lg shadow-orange/40 hover:-translate-y-0.5",
  outline:
    "border-2 border-orange text-orange hover:bg-orange hover:text-white",
};

function classes(variant: Variant, size: Size, className?: string) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className ?? ""}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return <button className={classes(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: Variant; size?: Size } & ComponentProps<typeof Link>) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
