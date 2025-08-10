export type Connection = {
  id: string;
  name: string;
  driver: "postgres" | "mysql" | "sqlite" | "mssql";
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  filePath?: string;
  ssl?: boolean;
};

export type QueryRun = {
  id: string;
  connectionId: string;
  sql: string;
  startedAt: number;
  durationMs?: number;
  status: "success" | "error" | "canceled" | "running";
  error?: string;
  rowCount?: number;
};

export type TableRow = Record<string, unknown>;

export type QueryResult = {
  columns: string[];
  rows: TableRow[];
  totalRows?: number;
  planSteps?: string[]; // EXPLAIN QUERY PLAN details (if available)
  insights?: string[];  // High-level insights derived from plan
  planTables?: { table: string; access: "SCAN" | "SEARCH" | "UNKNOWN"; totalRows?: number | null }[];
  rowsScannedEstimate?: number; // Sum of full-scan table row counts when available
};

export type RunQueryParams = {
  connectionId: string;
  sql: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
};

export type TableColumn = {
  name: string;
  dataType?: string | null;
  notNull: boolean;
  pk: boolean;
};

export type TableInfo = {
  name: string;
  columns: TableColumn[];
  keys: TableKey[];
};

export type ForeignKeyEdge = {
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
};

export type DbSchemaSummary = {
  tables: TableInfo[];
  foreignKeys: ForeignKeyEdge[];
};

export type TableKey = {
  keyType: "PRIMARY_KEY" | "FOREIGN_KEY" | "INDEX";
  name?: string | null;
  columns: string[];
  refTable?: string | null;
  refColumns?: string[] | null;
  unique?: boolean | null;
};


