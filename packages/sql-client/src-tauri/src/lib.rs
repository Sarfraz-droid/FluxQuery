use std::collections::HashMap;
use std::sync::Mutex;

use rusqlite::{params, Connection, OpenFlags, Row, types::ValueRef};
use serde::Serialize;

// Frontend expects camelCase keys
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PlanTableInfo {
    table: String,
    access: String, // SCAN | SEARCH | UNKNOWN
    total_rows: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct QueryResult {
    columns: Vec<String>,
    rows: Vec<HashMap<String, serde_json::Value>>,
    total_rows: Option<u64>,
    // Optional execution information for SELECT queries
    plan_steps: Option<Vec<String>>, // EXPLAIN QUERY PLAN detail strings
    insights: Option<Vec<String>>,   // Human-friendly summarized insights
    plan_tables: Option<Vec<PlanTableInfo>>, // Tables and access type
    rows_scanned_estimate: Option<u64>,      // Estimated rows scanned (sum of full scans)
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TableColumn {
    name: String,
    data_type: Option<String>,
    not_null: bool,
    pk: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TableKey {
    key_type: String,                // PRIMARY_KEY | FOREIGN_KEY | INDEX
    name: Option<String>,            // index name or None
    columns: Vec<String>,            // key columns (for FK: from columns)
    ref_table: Option<String>,       // for FK
    ref_columns: Option<Vec<String>>,// for FK target columns
    unique: Option<bool>,            // for INDEX
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TableInfo {
    name: String,
    columns: Vec<TableColumn>,
    keys: Vec<TableKey>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ForeignKeyEdge {
    from_table: String,
    from_columns: Vec<String>,
    to_table: String,
    to_columns: Vec<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DbSchemaSummary {
    tables: Vec<TableInfo>,
    foreign_keys: Vec<ForeignKeyEdge>,
}

#[derive(Default)]
struct AppState {
    // Maps connectionId -> sqlite file path
    sqlite_files: Mutex<HashMap<String, String>>,
}

fn value_ref_to_json(value: ValueRef<'_>) -> serde_json::Value {
    match value {
        ValueRef::Null => serde_json::Value::Null,
        ValueRef::Integer(i) => serde_json::json!(i),
        ValueRef::Real(f) => serde_json::json!(f),
        ValueRef::Text(t) => serde_json::json!(String::from_utf8_lossy(t)),
        ValueRef::Blob(b) => serde_json::json!(base64::encode(b)),
    }
}

fn row_to_map(row: &Row<'_>, column_names: &[String]) -> rusqlite::Result<HashMap<String, serde_json::Value>> {
    let mut map = HashMap::with_capacity(column_names.len());
    for (idx, col) in column_names.iter().enumerate() {
        let v = row.get_ref(idx)?;
        map.insert(col.clone(), value_ref_to_json(v));
    }
    Ok(map)
}

#[tauri::command]
fn sqlite_open(state: tauri::State<AppState>, connection_id: String, file_path: String) -> Result<(), String> {
    if file_path.is_empty() {
        return Err("filePath is required".into());
    }
    // Validate file can be opened
    let conn = Connection::open_with_flags(&file_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Failed to open SQLite file: {}", e))?;
    // A simple pragma to ensure it's a valid DB
    conn.pragma_query(None, "schema_version", |_| Ok(()))
        .map_err(|e| format!("Not a valid SQLite database: {}", e))?;
    drop(conn);

    let mut guard = state.sqlite_files.lock().map_err(|_| "state poisoned".to_string())?;
    guard.insert(connection_id, file_path);
    Ok(())
}

#[tauri::command]
fn run_sqlite_query(
    state: tauri::State<AppState>,
    connection_id: String,
    sql: String,
    page: u32,
    page_size: u32,
) -> Result<QueryResult, String> {
    let file_path = {
        let guard = state.sqlite_files.lock().map_err(|_| "state poisoned".to_string())?;
        guard.get(&connection_id).cloned().ok_or_else(|| "No SQLite file registered for this connection".to_string())?
    };

    let conn = Connection::open_with_flags(file_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Failed to open DB: {}", e))?;

    let trimmed = sql.trim_start();
    let is_select = trimmed.to_lowercase().starts_with("select");

    if !is_select {
        // Non-select: execute and return empty result
        conn.execute_batch(&sql)
            .map_err(|e| format!("Execution error: {}", e))?;
        return Ok(QueryResult { columns: vec![], rows: vec![], total_rows: None, plan_steps: None, insights: None, plan_tables: None, rows_scanned_estimate: None });
    }

    // Total rows
    let count_sql = format!("SELECT COUNT(*) AS count FROM ( {} )", sql);
    let total_rows: u64 = conn
        .query_row(&count_sql, [], |r| r.get::<_, i64>(0))
        .map(|v| v as u64)
        .map_err(|e| format!("Count error: {}", e))?;

    // Paged rows
    let paged_sql = format!("SELECT * FROM ( {} ) LIMIT ? OFFSET ?", sql);
    let mut stmt = conn
        .prepare(&paged_sql)
        .map_err(|e| format!("Prepare error: {}", e))?;

    let col_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    let offset: u32 = page.saturating_mul(page_size);
    let rows_iter = stmt
        .query_map(params![page_size as i64, offset as i64], |row| row_to_map(row, &col_names))
        .map_err(|e| format!("Query error: {}", e))?;

    let mut rows: Vec<HashMap<String, serde_json::Value>> = Vec::new();
    for item in rows_iter {
        rows.push(item.map_err(|e| format!("Row error: {}", e))?);
    }

    // Explain query plan for insights
    let mut plan_steps: Vec<String> = Vec::new();
    let mut explain_stmt = conn
        .prepare(&format!("EXPLAIN QUERY PLAN {}", sql))
        .map_err(|e| format!("Explain prepare error: {}", e))?;
    let explain_iter = explain_stmt
        .query_map([], |row| {
            // columns: id, parent, notused, detail
            let detail: String = row.get(3)?;
            Ok(detail)
        })
        .map_err(|e| format!("Explain query error: {}", e))?;
    for s in explain_iter {
        plan_steps.push(s.map_err(|e| format!("Explain row error: {}", e))?);
    }

    // Derive simple insights from plan
    let mut insights: Vec<String> = Vec::new();
    let mut table_access: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for step in &plan_steps {
        let upper = step.to_uppercase();
        if upper.contains("USING INDEX") {
            insights.push(format!("Index used: {}", step));
        }
        if upper.contains("SCAN ") && !upper.contains("SEARCH ") {
            insights.push(format!("Full scan: {}", step));
        }

        // Extract table name if present
        // Patterns observed:
        //   "SCAN TABLE <name>"
        //   "SEARCH <name> USING ..." (sometimes without TABLE)
        //   "SEARCH TABLE <name> USING ..."
        let access = if upper.contains("SEARCH ") { "SEARCH" } else if upper.contains("SCAN ") { "SCAN" } else { "UNKNOWN" };
        let mut pos = None;
        if let Some(i) = upper.find("SEARCH ") { pos = Some(i + 7); }
        if let Some(i) = upper.find("SCAN ") { pos = Some(i + 5); }
        if let Some(mut start) = pos {
            // skip whitespace
            let chars: Vec<char> = step.chars().collect();
            while start < chars.len() && chars[start].is_whitespace() { start += 1; }
            // Optional TABLE keyword (case-insensitive)
            let tail_upper = step[start..].to_uppercase();
            if tail_upper.starts_with("TABLE ") {
                start += 6; // len("TABLE ")
            }
            // Capture identifier or quoted name
            let mut name = String::new();
            if start < chars.len() && (chars[start] == '"' || chars[start] == '\'') {
                let quote = chars[start];
                start += 1;
                while start < chars.len() && chars[start] != quote { name.push(chars[start]); start += 1; }
            } else {
                while start < chars.len() {
                    let ch = chars[start];
                    if ch.is_alphanumeric() || ch == '_' { name.push(ch); start += 1; }
                    else { break; }
                }
            }
            if !name.is_empty() {
                // Prefer SCAN over SEARCH as a stronger signal
                let existing = table_access.get(&name).cloned();
                match existing.as_deref() {
                    Some("SCAN") => { /* keep SCAN */ }
                    _ => { table_access.insert(name, access.to_string()); }
                }
            }
        }
    }
    if insights.is_empty() && !plan_steps.is_empty() {
        insights.push("Plan analyzed with no obvious full scans".to_string());
    }

    // For tables referenced, collect total row counts and estimate scanned rows for full scans
    let mut plan_tables: Vec<PlanTableInfo> = Vec::new();
    let mut rows_scanned_estimate: u64 = 0;
    for (table, access) in table_access.into_iter() {
        // Skip SQLite internal tables
        if table.starts_with("sqlite_") { continue; }
        let total: Option<u64> = match conn.query_row(&format!("SELECT COUNT(*) FROM \"{}\"", table.replace('"', "")), [], |r| r.get::<_, i64>(0)) {
            Ok(v) => Some(v as u64),
            Err(_) => None,
        };
        if access == "SCAN" {
            if let Some(t) = total { rows_scanned_estimate = rows_scanned_estimate.saturating_add(t); }
        }
        plan_tables.push(PlanTableInfo { table, access, total_rows: total });
    }
    // Always return a numeric estimate (0 if no full scans detected)
    let rows_scanned_estimate_opt = Some(rows_scanned_estimate);

    Ok(QueryResult {
        columns: col_names,
        rows,
        total_rows: Some(total_rows),
        plan_steps: Some(plan_steps),
        insights: Some(insights),
        plan_tables: if plan_tables.is_empty() { None } else { Some(plan_tables) },
        rows_scanned_estimate: rows_scanned_estimate_opt,
    })
}

#[tauri::command]
fn sqlite_table_summary(state: tauri::State<AppState>, connection_id: String, table_name: String) -> Result<DbSchemaSummary, String> {
    let file_path = {
        let guard = state.sqlite_files.lock().map_err(|_| "state poisoned".to_string())?;
        guard.get(&connection_id).cloned().ok_or_else(|| "No SQLite file registered for this connection".to_string())?
    };
    let conn = Connection::open_with_flags(file_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Failed to open DB: {}", e))?;

    // tables list
    let mut table_stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .map_err(|e| format!("Prepare tables error: {}", e))?;
    let table_names_iter = table_stmt
        .query_map([], |row| row.get::<_, String>(0))
        .iter().filter(|row| row == &table_name)
        .map_err(|e| format!("Tables query error: {}", e))?;
    let mut tables: Vec<TableInfo> = Vec::new();
    let mut foreign_keys: Vec<ForeignKeyEdge> = Vec::new();
    for t in table_names_iter {
        let table_name = t.map_err(|e| format!("Error reading table name: {}", e))?;
        // columns
        let mut col_stmt = conn
            .prepare(&format!("PRAGMA table_info('{}')", table_name.replace("'", "''")))
            .map_err(|e| format!("Prepare table_info error: {}", e))?;
        let cols_iter = col_stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let data_type: Option<String> = row.get::<_, Option<String>>(2)?;
                let not_null: i64 = row.get(3)?;
                let pk: i64 = row.get(5)?;
                Ok(TableColumn { name, data_type, not_null: not_null != 0, pk: pk != 0 })
            })
            .map_err(|e| format!("table_info query error: {}", e))?;
        let mut cols: Vec<TableColumn> = Vec::new();
        let mut pk_cols: Vec<String> = Vec::new();
        for c in cols_iter {
            let col = c.map_err(|e| format!("column row error: {}", e))?;
            if col.pk { pk_cols.push(col.name.clone()); }
            cols.push(col);
        }
        let mut keys: Vec<TableKey> = Vec::new();
        if !pk_cols.is_empty() {
            keys.push(TableKey { key_type: "PRIMARY_KEY".into(), name: None, columns: pk_cols.clone(), ref_table: None, ref_columns: None, unique: None });
        }

        // foreign keys per table; also accumulate global edges
        let pragma = format!("PRAGMA foreign_key_list('{}')", table_name.replace("'", "''"));
        let mut fk_stmt = conn
            .prepare(&pragma)
            .map_err(|e| format!("Prepare foreign_key_list error: {}", e))?;
        let mut groups: HashMap<i64, (String, Vec<String>, Vec<String>)> = HashMap::new();
        let fk_iter = fk_stmt
            .query_map([], |row| {
                // columns: id, seq, table, from, to, on_update, on_delete, match
                let id: i64 = row.get(0)?;
                let ref_table: String = row.get(2)?;
                let from_col: String = row.get(3)?;
                let to_col: String = row.get(4)?;
                Ok((id, ref_table, from_col, to_col))
            })
            .map_err(|e| format!("foreign_key_list query error: {}", e))?;
        for r in fk_iter {
            let (id, ref_table, from_col, to_col) = r.map_err(|e| format!("fk row error: {}", e))?;
            let entry = groups.entry(id).or_insert_with(|| (ref_table, Vec::new(), Vec::new()));
            entry.1.push(from_col);
            entry.2.push(to_col);
        }
        for (_id, (ref_table, from_cols, to_cols)) in groups.into_iter() {
            keys.push(TableKey { key_type: "FOREIGN_KEY".into(), name: None, columns: from_cols.clone(), ref_table: Some(ref_table.clone()), ref_columns: Some(to_cols.clone()), unique: None });
            foreign_keys.push(ForeignKeyEdge {
                from_table: table_name.clone(),
                from_columns: from_cols,
                to_table: ref_table,
                to_columns: to_cols,
            });
        }

        // indexes
        let mut idx_stmt = conn
            .prepare(&format!("PRAGMA index_list('{}')", table_name.replace("'", "''")))
            .map_err(|e| format!("Prepare index_list error: {}", e))?;
        let idx_iter = idx_stmt
            .query_map([], |row| {
                // seq, name, unique, origin, partial
                let name: String = row.get(1)?;
                let unique: i64 = row.get(2)?;
                Ok((name, unique != 0))
            })
            .map_err(|e| format!("index_list query error: {}", e))?;
        for idx in idx_iter {
            let (idx_name, unique) = idx.map_err(|e| format!("index row error: {}", e))?;
            if idx_name.starts_with("sqlite_autoindex") { continue; }
            let mut info_stmt = conn
                .prepare(&format!("PRAGMA index_info('{}')", idx_name.replace("'", "''")))
                .map_err(|e| format!("Prepare index_info error: {}", e))?;
            let info_iter = info_stmt
                .query_map([], |row| {
                    // seqno, cid, name
                    let col_name: String = row.get(2)?;
                    Ok(col_name)
                })
                .map_err(|e| format!("index_info query error: {}", e))?;
            let mut index_cols: Vec<String> = Vec::new();
            for c in info_iter { index_cols.push(c.map_err(|e| format!("index_info row error: {}", e))?); }
            keys.push(TableKey { key_type: "INDEX".into(), name: Some(idx_name), columns: index_cols, ref_table: None, ref_columns: None, unique: Some(unique) });
        }

        tables.push(TableInfo { name: table_name, columns: cols, keys });
    }

    Ok(DbSchemaSummary { tables, foreign_keys })
}


#[tauri::command]
fn sqlite_schema_summary(state: tauri::State<AppState>, connection_id: String) -> Result<DbSchemaSummary, String> {
    let file_path = {
        let guard = state.sqlite_files.lock().map_err(|_| "state poisoned".to_string())?;
        guard.get(&connection_id).cloned().ok_or_else(|| "No SQLite file registered for this connection".to_string())?
    };
    let conn = Connection::open_with_flags(file_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Failed to open DB: {}", e))?;

    // tables list
    let mut table_stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .map_err(|e| format!("Prepare tables error: {}", e))?;
    let table_names_iter = table_stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Tables query error: {}", e))?;
    let mut tables: Vec<TableInfo> = Vec::new();
    let mut foreign_keys: Vec<ForeignKeyEdge> = Vec::new();
    for t in table_names_iter {
        let table_name = t.map_err(|e| format!("Error reading table name: {}", e))?;
        // columns
        let mut col_stmt = conn
            .prepare(&format!("PRAGMA table_info('{}')", table_name.replace("'", "''")))
            .map_err(|e| format!("Prepare table_info error: {}", e))?;
        let cols_iter = col_stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let data_type: Option<String> = row.get::<_, Option<String>>(2)?;
                let not_null: i64 = row.get(3)?;
                let pk: i64 = row.get(5)?;
                Ok(TableColumn { name, data_type, not_null: not_null != 0, pk: pk != 0 })
            })
            .map_err(|e| format!("table_info query error: {}", e))?;
        let mut cols: Vec<TableColumn> = Vec::new();
        let mut pk_cols: Vec<String> = Vec::new();
        for c in cols_iter {
            let col = c.map_err(|e| format!("column row error: {}", e))?;
            if col.pk { pk_cols.push(col.name.clone()); }
            cols.push(col);
        }
        let mut keys: Vec<TableKey> = Vec::new();
        if !pk_cols.is_empty() {
            keys.push(TableKey { key_type: "PRIMARY_KEY".into(), name: None, columns: pk_cols.clone(), ref_table: None, ref_columns: None, unique: None });
        }

        // foreign keys per table; also accumulate global edges
        let pragma = format!("PRAGMA foreign_key_list('{}')", table_name.replace("'", "''"));
        let mut fk_stmt = conn
            .prepare(&pragma)
            .map_err(|e| format!("Prepare foreign_key_list error: {}", e))?;
        let mut groups: HashMap<i64, (String, Vec<String>, Vec<String>)> = HashMap::new();
        let fk_iter = fk_stmt
            .query_map([], |row| {
                // columns: id, seq, table, from, to, on_update, on_delete, match
                let id: i64 = row.get(0)?;
                let ref_table: String = row.get(2)?;
                let from_col: String = row.get(3)?;
                let to_col: String = row.get(4)?;
                Ok((id, ref_table, from_col, to_col))
            })
            .map_err(|e| format!("foreign_key_list query error: {}", e))?;
        for r in fk_iter {
            let (id, ref_table, from_col, to_col) = r.map_err(|e| format!("fk row error: {}", e))?;
            let entry = groups.entry(id).or_insert_with(|| (ref_table, Vec::new(), Vec::new()));
            entry.1.push(from_col);
            entry.2.push(to_col);
        }
        for (_id, (ref_table, from_cols, to_cols)) in groups.into_iter() {
            keys.push(TableKey { key_type: "FOREIGN_KEY".into(), name: None, columns: from_cols.clone(), ref_table: Some(ref_table.clone()), ref_columns: Some(to_cols.clone()), unique: None });
            foreign_keys.push(ForeignKeyEdge {
                from_table: table_name.clone(),
                from_columns: from_cols,
                to_table: ref_table,
                to_columns: to_cols,
            });
        }

        // indexes
        let mut idx_stmt = conn
            .prepare(&format!("PRAGMA index_list('{}')", table_name.replace("'", "''")))
            .map_err(|e| format!("Prepare index_list error: {}", e))?;
        let idx_iter = idx_stmt
            .query_map([], |row| {
                // seq, name, unique, origin, partial
                let name: String = row.get(1)?;
                let unique: i64 = row.get(2)?;
                Ok((name, unique != 0))
            })
            .map_err(|e| format!("index_list query error: {}", e))?;
        for idx in idx_iter {
            let (idx_name, unique) = idx.map_err(|e| format!("index row error: {}", e))?;
            if idx_name.starts_with("sqlite_autoindex") { continue; }
            let mut info_stmt = conn
                .prepare(&format!("PRAGMA index_info('{}')", idx_name.replace("'", "''")))
                .map_err(|e| format!("Prepare index_info error: {}", e))?;
            let info_iter = info_stmt
                .query_map([], |row| {
                    // seqno, cid, name
                    let col_name: String = row.get(2)?;
                    Ok(col_name)
                })
                .map_err(|e| format!("index_info query error: {}", e))?;
            let mut index_cols: Vec<String> = Vec::new();
            for c in info_iter { index_cols.push(c.map_err(|e| format!("index_info row error: {}", e))?); }
            keys.push(TableKey { key_type: "INDEX".into(), name: Some(idx_name), columns: index_cols, ref_table: None, ref_columns: None, unique: Some(unique) });
        }

        tables.push(TableInfo { name: table_name, columns: cols, keys });
    }

    Ok(DbSchemaSummary { tables, foreign_keys })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![sqlite_open, run_sqlite_query, sqlite_schema_summary])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
