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
  
  
  export type TableRow = Record<string, unknown>;

  