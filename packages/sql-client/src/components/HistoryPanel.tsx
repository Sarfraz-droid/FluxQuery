import { Badge } from "./ui/badge";
import { useAppStore } from "../store";

export default function HistoryPanel() {
  const history = useAppStore((s) => s.history);
  const setEditorSql = useAppStore((s) => s.setEditorSql);
  return (
    <div className="p-2 space-y-2 overflow-auto h-full">
      <div className="text-xs uppercase text-gray-400 px-1">History</div>
      {history.length === 0 && <div className="text-xs text-gray-500 px-1">No history yet</div>}
      {history.map((h) => (
        <button key={h.id} className="w-full text-left text-sm p-2 rounded hover:bg-gray-800/60" onClick={() => setEditorSql(h.sql)}>
          <div className="flex items-center justify-between">
            <Badge
              variant={
                h.status === "error"
                  ? "destructive"
                  : h.status === "canceled"
                  ? "warning"
                  : h.status === "success"
                  ? "success"
                  : "default"
              }
            >
              {h.status}
            </Badge>
            <span className="text-xs text-gray-400">{new Date(h.startedAt).toLocaleTimeString()}</span>
          </div>
          <div className="truncate text-gray-300 text-xs mt-1">{h.sql}</div>
          {h.durationMs !== undefined && (
            <div className="text-[10px] text-gray-500">{h.durationMs} ms • {h.rowCount ?? 0} rows</div>
          )}
        </button>
      ))}
    </div>
  );
}


