import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store";
import type { TABLE_TYPE } from "shared";
import { Button } from "./ui/button";
import { useDbIndexer } from "../hooks/useDbIndexer";

export default function DbDetails() {
  const activeConnectionId = useAppStore((s) => s.activeConnectionId);
  const connections = useAppStore((s) => s.connections);
  const active = useMemo(() => connections.find((c) => c.id === activeConnectionId), [connections, activeConnectionId]);
  const [schema, setSchema] = useState<TABLE_TYPE.DbSchemaSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setSchema(null);
      try {
        if (!active) throw new Error("Select an active connection");
        if (active.driver !== "sqlite") throw new Error("Only SQLite supported in this build");
        if (!active.filePath) throw new Error("Select a SQLite file");
        await invoke("sqlite_open", { connectionId: active.id, filePath: active.filePath });
        const summary = await invoke<TABLE_TYPE.DbSchemaSummary>("sqlite_schema_summary", { connectionId: active.id });
        if (mounted) setSchema(summary);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [active?.id, active?.driver, active?.filePath]);

  const { isIndexing, indexDb } = useDbIndexer();

  

  if (!active) return <div className="p-4 text-sm text-gray-400">No active connection</div>;
  if (loading) return <div className="p-4 text-sm text-gray-400">Loading schema…</div>;
  if (error) return <div className="p-4 text-sm text-red-400">{error}</div>;
  if (!schema) return <div className="p-4 text-sm text-gray-400">No schema data</div>;

  return (
    <div className="p-4 space-y-6 overflow-auto h-full">
      <div>
        <div className="flex w-full justify-between">
          <div className="text-lg font-semibold">Tables</div>
          <div>
            <Button
              size="sm"
              className="my-0 py-0 px-5 font-mono"
              onClick={() => indexDb(schema, active?.id)}
              disabled={isIndexing}
            >
              {isIndexing ? <span className="text-xs text-gray-400">Indexing...</span> : <span>Index</span>}
            </Button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schema.tables.map((t) => (
            <div key={t.name} className="border panel rounded p-3 bg-gray-950/40">
              <div className="font-medium text-white">{t.name}</div>
              <div className="mt-2 text-xs">
                <table className="w-full text-left border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="pr-2">Column</th>
                      <th className="pr-2">Type</th>
                      <th className="pr-2">PK</th>
                      <th className="pr-2">Not Null</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.columns.map((c) => (
                      <tr key={c.name} className="text-gray-300">
                        <td className="pr-2">{c.name}</td>
                        <td className="pr-2">{c.dataType ?? ""}</td>
                        <td className="pr-2">{c.pk ? "✓" : ""}</td>
                        <td className="pr-2">{c.notNull ? "✓" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-lg font-semibold">Foreign Keys</div>
        {schema.foreignKeys.length === 0 ? (
          <div className="text-sm text-gray-400 mt-2">No foreign key relationships found</div>
        ) : (
          <div className="mt-2 space-y-2">
            {schema.foreignKeys.map((fk, idx) => (
              <div key={idx} className="border panel rounded p-2 text-sm bg-gray-950/40">
                <span className="text-gray-200">{fk.fromTable}</span>
                <span className="text-gray-400"> ({fk.fromColumns.join(", ")}) → </span>
                <span className="text-gray-200">{fk.toTable}</span>
                <span className="text-gray-400"> ({fk.toColumns.join(", ")})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


