import { useAppStore } from "../store";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { AgentMode } from "./Agent";

export default function RightPanel() {
  const activeConnectionId = useAppStore((s) => s.activeConnectionId);
  const connections = useAppStore((s) => s.connections);
  const active = connections.find((c) => c.id === activeConnectionId);
  const lastRun = useAppStore((s) => s.history.find((h) => h.id === s.lastRunId));
  return (
    <div className="h-full flex flex-col min-h-0">
      <Tabs defaultValue="properties" className="flex-1 min-h-0">
        <TabsList>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="min-h-0">
          <div className="p-3 space-y-3 overflow-auto h-full">
            <div className="text-xs uppercase text-gray-400">Context</div>
            <div className="text-sm space-y-1">
              <div className="text-gray-400">Active connection</div>
              {active ? (
                <div className="text-gray-200">
                  {active.name} <Badge className="ml-2">{active.driver}</Badge>
                </div>
              ) : (
                <div className="text-gray-500">None selected</div>
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-400">Last run</div>
              {lastRun ? (
                <div className="text-gray-200">
                  <div className="truncate">{lastRun.sql}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Badge
                      variant={
                        lastRun.status === "error"
                          ? "destructive"
                          : lastRun.status === "canceled"
                          ? "warning"
                          : lastRun.status === "success"
                          ? "success"
                          : "default"
                      }
                    >
                      {lastRun.status}
                    </Badge>
                    {lastRun.durationMs ? <span>{lastRun.durationMs} ms</span> : null}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No runs yet</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agent" className="min-h-0">
          <div className="p-3 space-y-3 overflow-auto h-full">
            <AgentMode />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


