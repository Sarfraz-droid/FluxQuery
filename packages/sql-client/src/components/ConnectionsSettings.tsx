import { useState } from "react";
import { useAppStore } from "../store";
import type { Connection } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export default function ConnectionsSettings() {
  const connections = useAppStore((s) => s.connections);
  const activeConnectionId = useAppStore((s) => s.activeConnectionId);
  const setActiveConnection = useAppStore((s) => s.setActiveConnection);
  const addOrUpdate = useAppStore((s) => s.addOrUpdateConnection);
  const remove = useAppStore((s) => s.removeConnection);

  const [draft, setDraft] = useState<Connection | null>(null);
  const startEdit = (conn?: Connection) => setDraft(conn ? { ...conn } : { id: crypto.randomUUID(), name: "", driver: "postgres" });
  const save = async () => {
    if (!draft) return;
    addOrUpdate(draft);
    if (draft.driver === "sqlite" && draft.filePath) {
      try { await invoke("sqlite_open", { connectionId: draft.id, filePath: draft.filePath }); } catch { /* ignore */ }
    }
    setDraft(null);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="text-lg font-semibold">Connections</div>
      <div className="flex items-center gap-2">
        <Button onClick={() => startEdit()}>Add</Button>
        <div className="text-xs text-gray-400">Active:</div>
        <Select value={activeConnectionId} onChange={(e) => setActiveConnection(e.target.value || undefined)}>
          <option value="">Select...</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        {connections.map((c) => (
          <div key={c.id} className="border panel rounded p-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-400">{c.driver}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => startEdit(c)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => remove(c.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="border panel rounded p-3 space-y-2">
          <div className="text-sm font-semibold">{draft.id ? "Edit" : "New"} Connection</div>
          <div className="grid grid-cols-2 gap-2">
            <Label>
              Name
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Label>
            <Label>
              Driver
              <Select value={draft.driver} onChange={(e) => setDraft({ ...draft, driver: e.target.value as Connection["driver"] })}>
                <option value="postgres">Postgres</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mssql">MSSQL</option>
              </Select>
            </Label>
            {draft.driver !== "sqlite" && (
              <>
                <Label>
                  Host
                  <Input value={draft.host ?? ""} onChange={(e) => setDraft({ ...draft, host: e.target.value })} />
                </Label>
                <Label>
                  Port
                  <Input type="number" value={draft.port ?? 0} onChange={(e) => setDraft({ ...draft, port: Number(e.target.value) || undefined })} />
                </Label>
                <Label>
                  Database
                  <Input value={draft.database ?? ""} onChange={(e) => setDraft({ ...draft, database: e.target.value })} />
                </Label>
                <Label>
                  User
                  <Input value={draft.user ?? ""} onChange={(e) => setDraft({ ...draft, user: e.target.value })} />
                </Label>
                <Label>
                  Password
                  <Input type="password" value={draft.password ?? ""} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
                </Label>
                <Label className="flex-row items-center">
                  SSL
                  <input className="ml-2" type="checkbox" checked={draft.ssl ?? false} onChange={(e) => setDraft({ ...draft, ssl: e.target.checked })} />
                </Label>
              </>
            )}
            {draft.driver === "sqlite" && (
              <div className="col-span-2 flex items-end gap-2">
                <Label className="flex-1">
                  File path
                  <Input value={draft.filePath ?? ""} onChange={(e) => setDraft({ ...draft, filePath: e.target.value })} />
                </Label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const file = await open({ multiple: false, directory: false, filters: [
                      { name: "SQLite", extensions: ["db", "sqlite", "sqlite3"] },
                    ] });
                    if (typeof file === "string") setDraft({ ...draft, filePath: file });
                  }}
                >Browse</Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}


