import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppStore } from "../store";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { getCurrentWindow } from "@tauri-apps/api/window";
// import type { MouseEvent as ReactMouseEvent } from "react";

type TopBarProps = {
  toggleLeft?: () => void;
  toggleRight?: () => void;
};

function IconCode(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M10 15l-3-3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 9.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
      <path d="M19.4 15a7.96 7.96 0 00.1-2l1.7-1.3-2-3.4-2 .5a8.04 8.04 0 00-1.7-1l-.3-2.1h-4l-.3 2.1c-.6.3-1.2.6-1.7 1l-2-.5-2 3.4L4.5 13a8.2 8.2 0 000 2l-1.6 1.2 2 3.4 2-.5c.5.4 1.1.7 1.7 1l.3 2.1h4l.3-2.1c.6-.3 1.2-.6 1.7-1l2 .5 2-3.4-1.6-1.2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDatabase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M19 5v6c0 1.7-3.1 3-7 3s-7-1.3-7-3V5" />
      <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}

function IconGraph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 19V5m0 14h16" strokeLinecap="round" />
      <path d="M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="15" r="1" />
      <circle cx="11" cy="11" r="1" />
      <circle cx="14" cy="13" r="1" />
      <circle cx="18" cy="7" r="1" />
    </svg>
  );
}

function IconCaret(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M9 10l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMinimize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M6 18h12" strokeLinecap="round" />
    </svg>
  );
}

function IconMaximize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 7l10 10M17 7L7 17" strokeLinecap="round" />
    </svg>
  );
}

function IconFluxQuery(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      {/* Flow rings */}
      <path d="M4 12c0-4.4 3.6-8 8-8 2.7 0 5.1 1.3 6.6 3.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12c0 4.4-3.6 8-8 8-2.7 0-5.1-1.3-6.6-3.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flux bar */}
      <path d="M9 12h6" strokeLinecap="round" />
      {/* Q tail */}
      <path d="M15 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TopBar({ toggleLeft, toggleRight }: TopBarProps) {
  const { runQuery, cancelQuery } = useAppStore();
  const runningJobId = useAppStore((s) => s.runningJobId);
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const routeToTab = (p: string): string => {
    if (p.startsWith("/settings")) return "settings";
    if (p.startsWith("/db")) return "db";
    if (p.startsWith("/visualizer")) return "visualizer";
    return "editor";
  };
  const tabToRoute: Record<string, string> = {
    editor: "/",
    settings: "/settings",
    db: "/db",
    visualizer: "/visualizer",
  };
  const currentTab = routeToTab(path);
  const win = getCurrentWindow();
  // Dragging is handled via data-tauri-drag-region attributes

  return (
    <div
      className="topbar flex items-center justify-between border-b panel bg-black/40 backdrop-blur px-3 select-none"
      data-tauri-drag-region="true"
    >
      <div className="flex items-center gap-3" data-tauri-drag-region="true">
        <div className="flex items-center gap-2 font-semibold text-white tracking-wide" data-tauri-drag-region="true">
          <IconFluxQuery className="w-5 h-5" />
          <span className="font-mono">FluxQuery</span>
        </div>
        <Tabs
          value={currentTab}
          onValueChange={(v) => {
            const to = tabToRoute[v] ?? "/";
            if (to !== path) navigate(to);
          }}
          className="hidden md:flex"
        >
          <TabsList>
            <TabsTrigger value="editor" draggable>
              <span className="flex items-center gap-2">
                <IconCode className="w-5 h-5" />
                <span className="font-mono">Editor</span>
                <IconCaret className="w-4 h-4 opacity-60" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="settings" draggable>
              <span className="flex items-center gap-2">
                <IconGear className="w-5 h-5" />
                <span className="font-mono">Settings</span>
                <IconCaret className="w-4 h-4 opacity-60" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="db" draggable>
              <span className="flex items-center gap-2">
                <IconDatabase className="w-5 h-5" />
                <span className="font-mono">DB Details</span>
                <IconCaret className="w-4 h-4 opacity-60" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="visualizer" draggable>
              <span className="flex items-center gap-2">
                <IconGraph className="w-5 h-5" />
                <span className="font-mono">Visualizer</span>
                <IconCaret className="w-4 h-4 opacity-60" />
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-2 hidden md:flex items-center gap-1">
          {toggleLeft && (
            <Button size="sm" variant="ghost" onClick={toggleLeft} aria-label="Toggle Left Panel" title="Toggle Left Panel">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M9 5v14" />
              </svg>
            </Button>
          )}
          {toggleRight && (
            <Button size="sm" variant="ghost" onClick={toggleRight} aria-label="Toggle Right Panel" title="Toggle Right Panel">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M15 5v14" />
              </svg>
            </Button>
          )}
        </div>
      </div>
      {/* Draggable spacer to allow grabbing anywhere in the top bar */}
      <div className="flex-1 h-10" data-tauri-drag-region="true" />
      <div className="flex items-center gap-2" data-tauri-drag-region="false">
        {runningJobId ? (
          <Button
            onClick={cancelQuery}
            variant="destructive"
            className="font-mono"
          >
            Cancel
          </Button>
        ) : (
          <Button
            onClick={() => { void runQuery(); }}
            variant="secondary"
            className="font-mono ring-1 ring-gray-400/40 hover:ring-gray-300/60 shadow-md hover:shadow-lg"
          >
            Run (⌘⏎)
          </Button>
        )}
        <div className="ml-2 flex items-center">
          <Button size="sm" variant="ghost" onClick={() => { void win.minimize(); }} aria-label="Minimize" title="Minimize">
            <IconMinimize className="w-4.5 h-4.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => { const isFull = await win.isFullscreen(); await win.setFullscreen(!isFull); }} aria-label="Fullscreen" title="Fullscreen / Windowed">
            <IconMaximize className="w-4.5 h-4.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { void win.close(); }} aria-label="Close" title="Close">
            <IconClose className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}


