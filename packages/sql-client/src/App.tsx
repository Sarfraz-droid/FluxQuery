import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar";
import HistoryPanel from "./components/HistoryPanel";
import EditorPane from "./components/EditorPane";
import ResultTable from "./components/ResultTable";
import ConnectionsSettings from "./components/ConnectionsSettings";
import RightPanel from "./components/RightPanel";
import VisualizerStub from "./components/VisualizerStub";
import DbDetails from "./components/DbDetails";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { useRef } from "react";
import "./App.css";

function EditorAndResults() {
  return (
    <PanelGroup direction="vertical" className="h-full min-h-0">
      <Panel defaultSize={35} minSize={10} className="min-h-0">
        <div className="h-full min-h-0 flex flex-col">
          <EditorPane />
        </div>
      </Panel>
      <PanelResizeHandle className="resize-handle-y bg-gray-800/60" />
      <Panel defaultSize={65} minSize={10} className="min-h-0">
        <div className="h-full min-h-0 flex flex-col">
          <ResultTable />
        </div>
      </Panel>
    </PanelGroup>
  );
}

function Layout() {
  const leftPanelRef = useRef<ImperativePanelHandle | null>(null);
  const rightPanelRef = useRef<ImperativePanelHandle | null>(null);

  const toggleLeft = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    // Toggle collapse/expand
    // Some versions expose isCollapsed; fallback to size check
    const maybeIsCollapsed = (panel as unknown as { isCollapsed?: () => boolean }).isCollapsed;
    const collapsed = typeof maybeIsCollapsed === "function" ? maybeIsCollapsed() : panel.getSize() === 0;
    if (collapsed) panel.expand(); else panel.collapse();
  };

  const toggleRight = () => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    const maybeIsCollapsed = (panel as unknown as { isCollapsed?: () => boolean }).isCollapsed;
    const collapsed = typeof maybeIsCollapsed === "function" ? maybeIsCollapsed() : panel.getSize() === 0;
    if (collapsed) panel.expand(); else panel.collapse();
  };

  return (
    <div className="app-container bg-black text-gray-100 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
      <TopBar toggleLeft={toggleLeft} toggleRight={toggleRight} />
      <div className="content overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full min-h-0">
          <Panel ref={leftPanelRef} id="left" defaultSize={18} minSize={0} collapsible collapsedSize={0} className="min-h-0">
            <div className="h-full overflow-hidden border-r panel bg-gray-950/40">
              <HistoryPanel />
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle-x bg-gray-800/60" />
          <Panel id="center" defaultSize={64} minSize={20} className="min-h-0">
            <div className="h-full min-h-0">
              <Routes>
                <Route path="/" element={<EditorAndResults />} />
                <Route path="/settings" element={<ConnectionsSettings />} />
                <Route path="/db" element={<DbDetails />} />
                <Route path="/visualizer" element={<VisualizerStub />} />
              </Routes>
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle-x bg-gray-800/60" />
          <Panel ref={rightPanelRef} id="right" defaultSize={18} minSize={0} collapsible collapsedSize={0} className="min-h-0">
            <div className="h-full overflow-hidden border-l panel bg-gray-950/40">
              <RightPanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
