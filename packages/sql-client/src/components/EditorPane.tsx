import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "../store";
import type { TABLE_TYPE } from "shared";
import Editor, { OnMount } from "@monaco-editor/react";
import { Button } from "./ui/button";
import type { languages as MonacoLanguages } from "monaco-editor";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";
import { FixWithAI } from "./FixWithAI";

export default function EditorPane() {
  const sql = useAppStore((s) => s.editorSql);
  const setSql = useAppStore((s) => s.setEditorSql);
  const setPage = useAppStore((s) => s.setPage);
  const schema = useAppStore((s) => s.schema);
  const refreshSchema = useAppStore((s) => s.refreshSchema);
  const lastActiveConn = useAppStore((s) => s.activeConnectionId);
  const monacoRef = useRef<any>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        useAppStore.getState().runQuery();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    void refreshSchema();
  }, [lastActiveConn]);

  const suggestions = useMemo<BaseSuggestion[]>(() => buildSqlSuggestions(schema), [schema]);
  const suggestionsRef = useRef<BaseSuggestion[]>([]);
  useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
  const schemaRef = useRef<TABLE_TYPE.DbSchemaSummary | null>(null);
  useEffect(() => { schemaRef.current = schema; }, [schema]);

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = { editor, monaco };
    // Basic SQL language registration if not present
    const disposables: { dispose: () => void }[] = [];
    try {
      // Theme aligned with app aesthetics (deep dark, subtle contrasts)
      monaco.editor.defineTheme("gian-sql-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280" },
          { token: "keyword", foreground: "93c5fd", fontStyle: "bold" },
          { token: "number", foreground: "fbbf24" },
          { token: "string", foreground: "86efac" },
          { token: "type", foreground: "fca5a5" },
          { token: "delimiter", foreground: "e5e7eb" },
          { token: "identifier", foreground: "e5e7eb" },
        ],
        colors: {
          "editor.background": "#0b0b0f",
          "editor.foreground": "#e5e7eb",
          "editorLineNumber.foreground": "#6b7280",
          "editorLineNumber.activeForeground": "#e5e7eb",
          "editorCursor.foreground": "#93c5fd",
          "editor.selectionBackground": "#1f293780",
          "editor.inactiveSelectionBackground": "#1f29375a",
          "editor.lineHighlightBackground": "#0f1115",
          "editorIndentGuide.background": "#1f2937",
          "editorIndentGuide.activeBackground": "#374151",
          "editorBracketMatch.background": "#111827",
          "editorBracketMatch.border": "#374151",
          "editorGutter.background": "#0b0b0f",
          "editorSuggestWidget.background": "#111827",
          "editorSuggestWidget.border": "#1f2937",
          "editorSuggestWidget.foreground": "#e5e7eb",
          "editorSuggestWidget.highlightForeground": "#93c5fd",
          "editorHoverWidget.background": "#111827",
          "editorHoverWidget.border": "#1f2937",
          "editorWidget.background": "#111827",
          "scrollbarSlider.background": "#37415166",
          "scrollbarSlider.hoverBackground": "#4b556366",
          "scrollbarSlider.activeBackground": "#9ca3af66",
        },
      });
      monaco.editor.setTheme("gian-sql-dark");

      // Keybinding: Cmd/Ctrl + Enter to run query
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        useAppStore.getState().runQuery();
      });

      // Register completion provider for SQL
      const provider = monaco.languages.registerCompletionItemProvider("sql", {
        triggerCharacters: [".", " ", "\n"],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const textBefore = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          const lineLower = textBefore.toLowerCase();
          const keywordItems = buildSqlKeywordSuggestions();
          const baseItems = suggestionsRef.current;

          // Context-aware filtering
          let out: BaseSuggestion[] = [];
          const dotMatch = /([a-zA-Z_][\w]*)\.$/.exec(textBefore);
          if (dotMatch && schemaRef.current) {
            const tableName = dotMatch[1];
            out = buildColumnSuggestionsForTable(schemaRef.current, tableName);
          } else if (/\bfrom\b|\bjoin\b/.test(lineLower)) {
            out = baseItems.filter((s) => !s.label.includes("."));
          } else {
            out = [...keywordItems, ...baseItems];
          }
          return { suggestions: out.map((s) => ({ ...s, range })) as unknown as MonacoLanguages.CompletionItem[] };
        },
      });
      disposables.push(provider);
    } catch {
      // noop
    }
    // Clean up on unmount
    return () => {
      disposables.forEach((d) => d.dispose());
    };
  };

  return (
    <div className="relative h-full min-h-0">
      <Editor
        height="100%"
        defaultLanguage="sql"
        theme="gian-sql-dark"
        value={sql}
        onChange={(val?: string) => { setSql(val ?? ""); setPage(0); }}
        options={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
          minimap: { enabled: false },
          wordWrap: "on",
          automaticLayout: true,
          quickSuggestions: { other: true, comments: true, strings: true },
          suggestOnTriggerCharacters: true,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          smoothScrolling: true,
          renderLineHighlight: "all",
          tabSize: 2,
          cursorSmoothCaretAnimation: "on",
          lineNumbersMinChars: 3,
          renderWhitespace: "selection",
          fontLigatures: true,
        }}
        onMount={handleMount}
      />
      <div className="absolute bottom-4 right-4 z-20">
        <FixWithAI />
      </div>
    </div>
  );
}

type BaseSuggestion = { label: string; insertText: string; kind: number; detail?: string };

function buildSqlSuggestions(schema: TABLE_TYPE.DbSchemaSummary | null): BaseSuggestion[] {
  if (!schema) return [];
  const items: BaseSuggestion[] = [];
  for (const table of schema.tables) {
    items.push({
      label: table.name,
      kind: 7, // CompletionItemKind.Class (table)
      insertText: table.name,
      detail: "table",
    });
    for (const col of table.columns) {
      items.push({
        label: `${table.name}.${col.name}`,
        kind: 5, // CompletionItemKind.Field
        insertText: `${table.name}.${col.name}`,
        detail: col.dataType ?? "column",
      });
      items.push({
        label: col.name,
        kind: 5,
        insertText: col.name,
        detail: `${table.name} column` + (col.dataType ? ` (${col.dataType})` : ""),
      });
    }
  }
  return items;
}

function buildColumnSuggestionsForTable(schema: TABLE_TYPE.DbSchemaSummary, tableName: string): BaseSuggestion[] {
  const table = schema.tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
  if (!table) return [];
  return table.columns.map((c) => ({
    label: c.name,
    kind: 5,
    insertText: c.name,
    detail: table.name + (c.dataType ? ` (${c.dataType})` : ""),
  }));
}

function buildSqlKeywordSuggestions(): BaseSuggestion[] {
  const keywords = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN",
    "ON", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET", "UNION", "UNION ALL",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE",
  ];
  return keywords.map((k) => ({ label: k, insertText: k, kind: 14, detail: "keyword" }));
}


