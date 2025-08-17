import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node, useEdgesState, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { useAppStore } from "../store";
import type { TABLE_TYPE } from "shared";
import { invoke } from "@tauri-apps/api/core";

const nodeWidth = 280;
const nodeHeight = 120;

function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  nodes.forEach((n) => {
    const p = g.node(n.id);
    n.position = { x: p.x - nodeWidth / 2, y: p.y - nodeHeight / 2 };
  });
  return { nodes, edges };
}

export default function VisualizerStub() {
  const activeConnectionId = useAppStore((s) => s.activeConnectionId);
  const connections = useAppStore((s) => s.connections);
  const active = useMemo(() => connections.find((c) => c.id === activeConnectionId), [connections, activeConnectionId]);

  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TABLE_TYPE.DbSchemaSummary | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [keyPage, setKeyPage] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    const fetchSchema = async () => {
      setError(null);
      try {
        if (!active) throw new Error("Select an active connection");
        if (active.driver !== "sqlite") throw new Error("Only SQLite supported in this build");
        if (!active.filePath) throw new Error("Select a SQLite file");
        await invoke("sqlite_open", { connectionId: active.id, filePath: active.filePath });
        const s = await invoke<TABLE_TYPE.DbSchemaSummary>("sqlite_schema_summary", { connectionId: active.id });
        if (!mounted) return;
        setSchema(s);
        setNodes([]);
        setEdges([]);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      }
    };
    fetchSchema();
    return () => { mounted = false; };
  }, [active?.id, active?.filePath, active?.driver, setNodes, setEdges]);

  if (!active) return <div className="flex-1 flex items-center justify-center text-gray-500">No active connection</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>;

  // rebuild graph when selection or key page changes
  useEffect(() => {
    if (!schema) return;
    const tables = schema.tables.filter((t) => selected.includes(t.name));
    const edgesFiltered = schema.foreignKeys.filter((fk) => selected.includes(fk.fromTable) && selected.includes(fk.toTable));

    const nodeList: Node[] = tables.map((t) => {
      const page = keyPage[t.name] ?? 0;
      const keys = t.keys.slice(page * 10, page * 10 + 10);
      const totalPages = Math.max(1, Math.ceil((t.keys.length || 0) / 10));
      return {
        id: t.name,
        data: {
          label: (
            <div className="text-xs">
              <div className="font-semibold text-gray-100 mb-1">{t.name}</div>
              <div className="text-[10px] text-gray-400">{t.columns.length} columns</div>
              <div className="mt-2 max-h-24 overflow-auto">
                {keys.map((k, idx) => (
                  <div key={idx} className="text-[10px] text-gray-300 truncate">
                    <span className="text-gray-400">{k.keyType}</span> {k.name ? <span>({k.name})</span> : null}: {k.columns.join(", ")}
                    {k.refTable ? <span className="text-gray-500"> → {k.refTable}{k.refColumns ? ` (${k.refColumns.join(", ")})` : ""}</span> : null}
                    {k.unique ? <span className="text-gray-500"> [unique]</span> : null}
                  </div>
                ))}
              </div>
              {t.keys.length > 10 && (
                <div className="mt-1 flex items-center justify-between">
                  <button className="text-[10px] text-gray-400 hover:text-gray-200" onClick={(e) => { e.stopPropagation(); setKeyPage((p) => ({ ...p, [t.name]: Math.max(0, (p[t.name] ?? 0) - 1) })); }}>Prev</button>
                  <div className="text-[10px] text-gray-400">Page {page + 1} / {totalPages}</div>
                  <button className="text-[10px] text-gray-400 hover:text-gray-200" onClick={(e) => { e.stopPropagation(); setKeyPage((p) => ({ ...p, [t.name]: Math.min(totalPages - 1, (p[t.name] ?? 0) + 1) })); }}>Next</button>
                </div>
              )}
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          background: "#0a0a0a",
          color: "#e5e7eb",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 8,
          width: nodeWidth,
          minHeight: nodeHeight,
        },
      } as Node;
    });

    const edgeList: Edge[] = edgesFiltered.map((fk, i) => ({
      id: `${fk.fromTable}-${fk.toTable}-${i}`,
      source: fk.fromTable,
      target: fk.toTable,
      animated: false,
      style: { stroke: "#64748b" },
      label: `${fk.fromColumns.join(", ")} → ${fk.toColumns.join(", ")}`,
      labelStyle: { fill: "#94a3b8", fontSize: 10, background: "#00000066" },
    }));

    const { nodes: laidNodes, edges: laidEdges } = layout(nodeList, edgeList);
    setNodes(laidNodes);
    setEdges(laidEdges);
  }, [schema, selected, keyPage, setNodes, setEdges]);

  const tableList = schema?.tables ?? [];

  return (
    <div className="h-full min-h-0 flex">
      <div className="w-64 border-r panel bg-black/30 p-2 overflow-auto">
        <div className="text-xs uppercase text-gray-400 px-1 mb-2">Tables</div>
        <div className="space-y-1">
          {tableList.map((t) => {
            const checked = selected.includes(t.name);
            return (
              <label key={t.name} className="flex items-center gap-2 text-sm text-gray-200 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-gray-300"
                  checked={checked}
                  onChange={(e) => {
                    setSelected((prev) => e.target.checked ? Array.from(new Set([...prev, t.name])) : prev.filter((n) => n !== t.name));
                  }}
                />
                <span className="truncate">{t.name}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2 px-1">
          <button className="text-xs text-gray-400 hover:text-gray-200" onClick={() => setSelected(tableList.map((t) => t.name))}>All</button>
          <button className="text-xs text-gray-400 hover:text-gray-200" onClick={() => setSelected([])}>Clear</button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="#334155" gap={24} size={1} />
          <MiniMap pannable zoomable nodeColor={() => "#1f2937"} nodeStrokeColor={() => "#475569"} maskColor="#00000088" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}


