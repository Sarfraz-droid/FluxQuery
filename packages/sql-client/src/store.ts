import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Connection, QueryResult, QueryRun, DbSchemaSummary } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { WEBSOCKET_EVENTS } from "shared";

async function runQuerySqlite(params: { connectionId: string; sql: string; page: number; pageSize: number; signal?: AbortSignal; }): Promise<QueryResult> {
  // Abort handling is client-side only. If aborted, throw like fetch does.
  if (params.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const result = await invoke<QueryResult>("run_sqlite_query", {
    connectionId: params.connectionId,
    sql: params.sql,
    page: params.page,
    pageSize: params.pageSize,
  });
  return result;
}

type StoreState = {
  connections: Connection[];
  activeConnectionId?: string;
  history: QueryRun[];
  editorSql: string;
  schema: DbSchemaSummary | null;
  page: number;
  pageSize: number;
  runningJobId: string | null;
  result: QueryResult | null;
  lastRunId: string | null;
  wsStatus: "disconnected" | "connecting" | "connected";
  deviceId: string;
  setEditorSql: (sql: string) => void;
  refreshSchema: () => Promise<void>;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  addOrUpdateConnection: (conn: Connection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | undefined) => void;
  runQuery: (opts?: { silent?: boolean }) => Promise<void>;
  cancelQuery: () => void;
  initWebSocket: () => void;
  sendMessage: (message: string) => void;
};

export const useAppStore = create<StoreState>()(persist((set, get) => {
  let abortController: AbortController | undefined;
  let websocket: WebSocket | null = null;
  return {
    connections: [
      { id: "demo-pg", name: "Demo Postgres", driver: "postgres", host: "localhost", port: 5432, database: "postgres", user: "postgres" },
      { id: "demo-sqlite", name: "Demo SQLite", driver: "sqlite", filePath: "/tmp/demo.db" },
    ],
    activeConnectionId: "demo-sqlite",
    history: [],
    editorSql: "select 1 as id, 'hello' as name;",
      schema: null,
    page: 0,
    pageSize: 10,
    runningJobId: null,
    result: null,
    lastRunId: null,
    wsStatus: "disconnected",
    deviceId: crypto.randomUUID(),
    setEditorSql: (sql) => set({ editorSql: sql }),
    initWebSocket: () => {
      const { wsStatus, deviceId } = get();
      if (wsStatus === "connected" || wsStatus === "connecting") return;
      set({ wsStatus: "connecting" });
      try {
        const wsUrl = `ws://localhost:8081/?deviceId=${encodeURIComponent(deviceId)}`;
        console.log("Connecting to WebSocket at:", wsUrl);
        websocket = new WebSocket(wsUrl);
        websocket.onopen = () => {
          set({ wsStatus: "connected" });
          window.dispatchEvent(new CustomEvent(WEBSOCKET_EVENTS.OPEN));
        };
        websocket.onmessage = (event: MessageEvent) => {
          // For now, just log. Wire to state as needed later.
          console.debug("WS message:", event.data);
          window.dispatchEvent(new CustomEvent(WEBSOCKET_EVENTS.MESSAGE, { detail: event.data }));
        };
        websocket.onclose = () => {
          websocket = null;
          set({ wsStatus: "disconnected" });
          window.dispatchEvent(new CustomEvent(WEBSOCKET_EVENTS.CLOSE));
        };
        websocket.onerror = () => {
          // Error will likely be followed by close
          window.dispatchEvent(new CustomEvent(WEBSOCKET_EVENTS.ERROR));
        };
      } catch (_e) {
        set({ wsStatus: "disconnected" });
      }
    },
    sendMessage: (message: any) => {
      if (!websocket) return;
      websocket.send(JSON.stringify(message));
    },
      refreshSchema: async () => {
        const { activeConnectionId, connections } = get();
        if (!activeConnectionId) {
          set({ schema: null });
          return;
        }
        const active = connections.find((c) => c.id === activeConnectionId);
        if (!active) {
          set({ schema: null });
          return;
        }
        if (active.driver !== "sqlite") {
          set({ schema: null });
          return;
        }
        if (!active.filePath) {
          set({ schema: null });
          return;
        }
        await invoke("sqlite_open", { connectionId: active.id, filePath: active.filePath });
        const summary = await invoke<DbSchemaSummary>("sqlite_schema_summary", { connectionId: active.id });
        set({ schema: summary });
      },
    setPage: (p) => set({ page: p }),
    setPageSize: (_s) => set({ pageSize: 10 }),
    addOrUpdateConnection: (conn) =>
      set((st) => {
        const existingIndex = st.connections.findIndex((c) => c.id === conn.id);
        const connections = [...st.connections];
        if (existingIndex >= 0) connections[existingIndex] = conn; else connections.push(conn);
        return { connections };
      }),
    removeConnection: (id) =>
      set((st) => ({ connections: st.connections.filter((c) => c.id !== id), activeConnectionId: st.activeConnectionId === id ? undefined : st.activeConnectionId })),
    setActiveConnection: (id) => set({ activeConnectionId: id }),
    cancelQuery: () => {
      abortController?.abort();
    },
    runQuery: async (opts) => { 
      const silent = opts?.silent ?? false;
      const { editorSql, page, pageSize, activeConnectionId, connections } = get();
      if (!activeConnectionId) {
        const id = crypto.randomUUID();
        set((st) => ({
          history: [
            { id, connectionId: "", sql: editorSql, startedAt: Date.now(), status: "error", error: "Select an active connection first" },
            ...st.history,
          ],
          lastRunId: id,
        }));
        return;
      }
      const runId = crypto.randomUUID();
      abortController = new AbortController();
      const startedAt = Date.now();
      set((st) => ({
        runningJobId: runId,
        history: silent
          ? st.history
          : [
              { id: runId, connectionId: activeConnectionId, sql: editorSql, startedAt, status: "running" },
              ...st.history,
            ],
        lastRunId: silent ? st.lastRunId : runId,
      }));
      try { 
        const active = connections.find((c) => c.id === activeConnectionId);
        if (!active) throw new Error("Active connection not found");
        let result: QueryResult;
        if (active.driver === "sqlite") {
          if (!active.filePath) throw new Error("Select a SQLite file first");
          // Ensure backend knows about this mapping
          await invoke("sqlite_open", { connectionId: active.id, filePath: active.filePath });
          result = await runQuerySqlite({ connectionId: active.id, sql: editorSql, page, pageSize, signal: abortController.signal });
        } else {
          throw new Error("Only SQLite is supported in this build");
        }
        const durationMs = Date.now() - startedAt;
        set((st) => {
          let nextHistory = st.history;
          if (silent) {
            if (st.lastRunId) {
              nextHistory = st.history.map((h) =>
                h.id === st.lastRunId ? { ...h, status: "success", durationMs, rowCount: result.rows.length } : h,
              );
            }
          } else {
            nextHistory = st.history.map((h) => (h.id === runId ? { ...h, status: "success", durationMs, rowCount: result.rows.length } : h));
          }
          return {
            result,
            runningJobId: undefined,
            history: nextHistory,
          };
        });
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        set((st) => {
          let nextHistory = st.history;
          if (silent) {
            if (st.lastRunId) {
              nextHistory = st.history.map((h) =>
                h.id === st.lastRunId
                  ? { ...h, status: isAbort ? "canceled" : "error", durationMs, error: isAbort ? "Canceled" : (err as Error).message }
                  : h,
              );
            }
          } else {
            nextHistory = st.history.map((h) =>
              h.id === runId
                ? { ...h, status: isAbort ? "canceled" : "error", durationMs, error: isAbort ? "Canceled" : (err as Error).message }
                : h,
            );
          }
          return {
            runningJobId: undefined,
            history: nextHistory,
          };
        });
      }
    },
  };
}, {
  name: "gian-sql-store",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    connections: state.connections,
    activeConnectionId: state.activeConnectionId,
    editorSql: state.editorSql,
    deviceId: state.deviceId,
  }),
}));


