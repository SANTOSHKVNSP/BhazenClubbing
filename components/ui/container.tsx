import type { ComponentProps } from "react";

export function Container({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-6 ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
