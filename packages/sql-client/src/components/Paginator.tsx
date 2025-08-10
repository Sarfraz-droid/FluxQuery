import { useAppStore } from "../store";
import { Button } from "./ui/button";

export default function Paginator() {
  const page = useAppStore((s) => s.page);
  const pageSize = useAppStore((s) => s.pageSize);
  const setPage = useAppStore((s) => s.setPage);
  const total = useAppStore((s) => s.result?.totalRows);
  const runQuery = useAppStore((s) => s.runQuery);
  const runningJobId = useAppStore((s) => s.runningJobId);
  const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const isRunning = Boolean(runningJobId);
  const canGoPrev = !isRunning && page > 0;
  const canGoNext = !isRunning && (totalPages === undefined || page + 1 < totalPages);
  return (
    <div className="flex items-center gap-2 p-2 border-t panel bg-gray-950/60">
      <Button
        variant="secondary"
        size="sm"
        disabled={!canGoPrev}
        onClick={async () => {
          const newPage = Math.max(0, page - 1);
          setPage(newPage);
          await runQuery({ silent: true });
        }}
      >
        Prev
      </Button>
      <div className="text-xs text-gray-300">Page {page + 1}{totalPages ? ` / ${totalPages}` : ""}</div>
      <Button
        variant="secondary"
        size="sm"
        disabled={!canGoNext}
        onClick={async () => {
          const newPage = page + 1;
          setPage(newPage);
          await runQuery({ silent: true });
        }}
      >
        Next
      </Button>
      <div className="ml-auto text-xs text-gray-400">Rows/page: {pageSize}</div>
    </div>
  );
}


