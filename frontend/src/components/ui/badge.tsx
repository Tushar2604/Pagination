import * as React from "react";
import { cn } from "@lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide";
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-transparent bg-muted text-muted-foreground",
    outline: "border-border text-muted-foreground",
  };

  return <span className={cn(base, variants[variant], className)} {...props} />;
}

