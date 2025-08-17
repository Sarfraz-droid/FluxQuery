import * as React from "react";
import { cn } from "../../lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant =
  | "default"
  | "secondary"
  | "destructive"
  | "ghost";

type Size = "sm" | "md" | "lg" | "xs";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

// Monochrome palette with accent grayscale
const variantClass: Record<Variant, string> = {
  default:
    "bg-gray-100 hover:bg-white text-gray-900 border border-gray-300",
  secondary:
    "bg-gray-900 hover:bg-gray-800 text-gray-100 border border-gray-700",
  destructive:
    "bg-gray-800 hover:bg-gray-700 text-red-300 border border-gray-700",
  ghost: "bg-transparent hover:bg-gray-900/40 text-gray-200 border border-transparent",
};

const sizeClass: Record<Size, string> = {
  xs: "h-6 px-2 text-xs rounded",
  sm: "h-8 px-2 text-xs rounded",
  md: "h-9 px-3 text-sm rounded",
  lg: "h-10 px-4 text-sm rounded",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        // Hygiene: prevent unexpected form submissions
        type={(props as any).type ?? "button"}
        // Tauri hygiene: ensure buttons are not part of drag region
        data-tauri-drag-region="false"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md cursor-pointer",
          "disabled:opacity-50 disabled:pointer-events-none",
          "disabled:cursor-not-allowed",
          // Focus styles for accessibility hygiene
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "focus-visible:ring-gray-300 focus-visible:ring-offset-gray-950",
          "transition-[background,box-shadow,border,transform] duration-150",
          "shadow-sm hover:shadow",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";


