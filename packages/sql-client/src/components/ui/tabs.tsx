import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ value, defaultValue, onValueChange, className, children }: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? "");
  const current = isControlled ? (value as string) : internal;

  const ctx = useMemo<TabsContextValue>(
    () => ({
      value: current,
      setValue: (v) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);
      },
    }),
    [current, isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col min-h-0", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-gray-800 px-2", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, draggable = false }: { value: string; children: React.ReactNode; draggable?: boolean }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      data-tauri-drag-region={draggable ? "true" : "false"}
      className={cn(
        "relative px-4 py-3 text-sm font-mono rounded-t transition-colors cursor-pointer",
        active ? "text-white" : "text-gray-400 hover:text-gray-200"
      )}
      onClick={() => ctx.setValue(value)}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute left-0 right-0 -bottom-px h-[3px] transition-all",
          active ? "bg-gray-300" : "bg-transparent"
        )}
      />
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside Tabs");
  const active = ctx.value === value;
  return (
    <div className={cn("flex-1 min-h-0", !active && "hidden", className)}>
      {children}
    </div>
  );
}


