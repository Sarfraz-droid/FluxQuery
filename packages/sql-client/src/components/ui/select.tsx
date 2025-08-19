import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

type OptionType = { value: string; label: React.ReactNode };

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, value, onChange, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const [openUpward, setOpenUpward] = React.useState(false);
    // alignment computed per open; no state needed
    const [menuWidth, setMenuWidth] = React.useState<number>(160);
    const [menuLeft, setMenuLeft] = React.useState<number>(0);
    const [menuTop, setMenuTop] = React.useState<number>(0);
    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const options: OptionType[] = React.useMemo(() => {
      const arr = React.Children.toArray(children) as React.ReactElement<any>[];
      return arr
        .filter((el) => React.isValidElement(el) && (el.type as any) === "option")
        .map((el) => {
          const p = (el as React.ReactElement<any>).props as any;
          return { value: String(p?.value ?? p?.children), label: p?.children } as OptionType;
        });
    }, [children]);

    const selected = options.find((o) => o.value === String(value ?? "")) ?? options[0];

    React.useEffect(() => {
      function onDocClick(e: MouseEvent) {
        const t = e.target as Node;
        const inButton = !!containerRef.current?.contains(t);
        const inMenu = !!menuRef.current?.contains(t);
        if (!inButton && !inMenu) setOpen(false);
      }
      function onEsc(e: KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
      }
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onEsc);
      };
    }, []);

    const updatePlacement = React.useCallback(() => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const estimatedItemHeight = 28; // px
      const estimatedMax = 240; // px
      const estimatedMenuHeight = Math.min(estimatedMax, (options.length || 1) * estimatedItemHeight + 8);

      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const shouldOpenUp = spaceBelow < Math.min(estimatedMenuHeight, estimatedMax) && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUp);

      const estWidth = Math.min(160, viewportWidth - 16);
      const overflowRight = rect.left + estWidth + 4 > viewportWidth;
      setMenuWidth(estWidth);
      const left = overflowRight ? Math.max(8, rect.right - estWidth) : Math.max(8, rect.left);
      const top = shouldOpenUp ? rect.top - 4 : rect.bottom + 4;
      setMenuLeft(left);
      setMenuTop(top);
    }, [options.length]);

    React.useEffect(() => {
      if (!open) return;
      updatePlacement();
      const onResize = () => updatePlacement();
      const onScroll = () => updatePlacement();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onScroll, true);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll, true);
      };
    }, [open, updatePlacement]);

    const handleSelect = (val: string) => {
      setOpen(false);
      if (onChange) {
        const synthetic = { target: { value: val } } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(synthetic);
      }
    };

    return (
      <div ref={containerRef} className={cn("relative inline-block flex-none shrink-0")}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          ref={buttonRef}
          className={cn(
            "h-8 px-2 inline-flex items-center gap-2 rounded-sm w-32",
            "bg-gray-950 border border-gray-800 text-gray-200 text-xs",
            "outline-none focus:ring-2 focus:ring-white/10",
            disabled ? "opacity-60 cursor-not-allowed" : "hover:border-gray-700",
            "font-mono",
            className
          )}
        >
          <span className="truncate min-w-0 flex-1">{selected?.label}</span>
          <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 10l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className={cn(
              "fixed z-[9999]",
              "bg-gray-950 border border-gray-800 rounded-sm shadow-lg",
              "py-1 max-h-60 overflow-auto"
            )}
            style={{ left: menuLeft, top: menuTop, width: menuWidth, transform: openUpward ? "translateY(-100%)" : "none" }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={String(value ?? "") === opt.value}
                className={cn(
                  "px-2 py-1.5 text-xs cursor-pointer font-mono",
                  "text-gray-200",
                  String(value ?? "") === opt.value ? "bg-gray-900" : "hover:bg-gray-900"
                )}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  }
);
Select.displayName = "Select";


