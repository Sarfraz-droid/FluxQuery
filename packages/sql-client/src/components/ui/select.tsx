import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "bg-black/40 border panel rounded px-3 py-2 text-sm text-gray-100 outline-none",
          "focus:ring-2 focus:ring-white/10 focus:border-gray-500",
          "transition-colors duration-150",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";


