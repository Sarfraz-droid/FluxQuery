import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import Paginator from "./Paginator";
import type { TableRow } from "../types";
import { Table, Thead, Tbody, Tr, Th, Td } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
 
export default function ResultTable() {
  const result = useAppStore((s) => s.result);
  
  const lastRun = useAppStore((s) => s.history.find((h) => h.id === s.lastRunId));
  const page = useAppStore((s) => s.page);
  const pageSize = useAppStore((s) => s.pageSize);

  // Query runs only on explicit Run trigger; pagination changes do not auto-run

  const columns: ColumnDef<TableRow>[] = (result?.columns ?? []).map((col) => ({
    header: col,
    accessorKey: col,
    cell: (info) => String(info.getValue() ?? ""),
  }));

  const table = useReactTable({
    data: result?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hasError = lastRun?.status === "error";
  const defaultTab = hasError ? "messages" : "data";
  const [tabValue, setTabValue] = useState<string>(defaultTab);

  // Track whether new data arrived while not viewing the Data tab
  const lastAckRunIdRef = useRef<string | null>(null);
  const [showDataIndicator, setShowDataIndicator] = useState(false);

  useEffect(() => {
    if (lastRun?.status === "success") {
      const runId = lastRun.id;
      if (lastAckRunIdRef.current !== runId) {
        if (tabValue !== "data") setShowDataIndicator(true);
        else lastAckRunIdRef.current = runId;
      }
    }
  }, [lastRun?.id, lastRun?.status, tabValue]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs value={tabValue} onValueChange={(v) => {
        setTabValue(v);
        if (v === "data") {
          setShowDataIndicator(false);
          if (lastRun?.id) lastAckRunIdRef.current = lastRun.id;
        }
      }} className="flex-1 min-h-0">
        <TabsList>
          <TabsTrigger value="data">
            <span className="flex items-center gap-2">
              Data
              {showDataIndicator && (
                <span
                  className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse"
                  aria-label="New data available"
                />
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="flex flex-col min-h-0">
          {!result ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">No results</div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <Table className="table-auto border-collapse">
                  <Thead>
                    {table.getHeaderGroups().map((hg) => (
                      <Tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <Th key={header.id} className="sticky top-0">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </Thead>
                  <Tbody>
                    {table.getRowModel().rows.map((row, rowIndex) => (
                      <Tr key={row.id} className={rowIndex % 2 === 0 ? "bg-gray-950" : "bg-gray-900"}>
                        {row.getVisibleCells().map((cell) => (
                          <Td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
              <Paginator />
            </>
          )}
        </TabsContent>

        <TabsContent value="messages" className="flex flex-col min-h-0">
          {hasError ? (
            <div className="p-3 text-sm font-mono bg-red-950/50 text-red-300 border-b border-red-900">
              {lastRun?.error ?? "Query failed"}
            </div>
          ) : lastRun?.status === "success" ? (
            <div className="p-3 text-sm font-mono bg-emerald-950/40 text-emerald-200 border-b border-emerald-900 space-y-2">
              <div>Query succeeded</div>
              <div>Time executed: {lastRun?.durationMs ?? 0} ms</div>
              <div>
                Rows returned: {lastRun?.rowCount ?? result?.rows.length ?? 0}
                {result?.totalRows !== undefined ? ` / ${result.totalRows} total` : ""}
              </div>
              <div>Page: {page + 1} | Rows/page: {pageSize}</div>
              {result?.rowsScannedEstimate !== undefined && (
                <div>Estimated rows scanned: {result.rowsScannedEstimate}</div>
              )}
              {result?.planTables && result.planTables.length > 0 && (
                <div className="mt-1">
                  <div className="text-emerald-300/80">Table access:</div>
                  <ul className="list-disc ml-5 space-y-0.5">
                    {result.planTables.map((t) => (
                      <li key={`${t.table}-${t.access}`}>
                        {t.table}: {t.access}
                        {t.totalRows !== undefined && t.totalRows !== null ? ` (${t.totalRows} rows)` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result?.insights && result.insights.length > 0 && (
                <div className="mt-1">
                  <div className="text-emerald-300/80">Insights:</div>
                  <ul className="list-disc ml-5 space-y-0.5">
                    {result.insights.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result?.planSteps && result.planSteps.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-emerald-300/80">Explain plan details</summary>
                  <ul className="list-disc ml-5 mt-1 space-y-0.5">
                    {result.planSteps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <div className="p-3 text-xs text-gray-400 font-mono">No messages</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


