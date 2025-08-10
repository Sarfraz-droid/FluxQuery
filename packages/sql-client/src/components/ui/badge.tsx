import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "success" | "warning" | "destructive";

const variants: Record<Variant, string> = {
  default: "bg-gray-800 text-gray-200 border border-gray-700",
  success: "bg-emerald-800 text-emerald-100 border border-emerald-700",
  warning: "bg-yellow-800 text-yellow-100 border border-yellow-700",
  destructive: "bg-red-800 text-red-100 border border-red-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => (
  <span
    className={cn("inline-flex items-center px-2 py-0.5 text-[10px] rounded", variants[variant], className)}
    {...props}
  />
);


