import { useState } from 'react'
import { ActionType, EventType, TABLE_TYPE, WebSocketEvents, WebSocketMessage, WebSocketPayload } from 'shared';
import { useAppStore } from '../../store';
import { useAgentModeStore } from '../../store/agentMode.store';
import { invoke } from '@tauri-apps/api/core';
import { QueryResult } from '../../types';
import { TableRow } from 'shared/table.type';

export const useAgentMode = () => {
    const [userInput, setUserInput] = useState("");
    const sendMessage = useAppStore((state) => state.sendMessage);
    const { updateIsRunning, addQuery, isRunning, addMessage, messages, reset } = useAgentModeStore();
    const { setEditorSql } = useAppStore();
    const active = useAppStore((state) => state.activeConnectionId);

    const handleSend = async () => {

        const schema = await invoke<TABLE_TYPE.DbSchemaSummary>("sqlite_schema_summary", {
            connectionId: active,
        });

        reset();

        console.log("schema: ", schema);

        const data: WebSocketPayload = {
            event: WebSocketEvents.AGENT,
            data: {
                prompt: userInput,
                schema
            },
            action: ActionType.INITIATE
        }
        addMessage("🧠 Analyzing your request against the database schema…");
        if (userInput?.trim()) {
            addMessage(`📝 Request: "${userInput.trim()}"`);
        }
        updateIsRunning(true);

        sendMessage(data);
    }

    const handleData = (data: WebSocketMessage) => {
        console.log("data: ", data);

        if (data.event !== WebSocketEvents.AGENT) {
            throw new Error("Invalid event");
        }
        switch (data.eventType) {
            case EventType.QUERY:
                handleQuery(data);
                break;
            case EventType.RESULT:
                handleResult(data);
                break;
        }
    }

    const handleQuery = async (data: WebSocketMessage) => {
        console.log("data: ", data);
        
        // Deduplicate identical queries on the client in case of accidental repeats
        const normalize = (sql: string) => sql.toLowerCase().replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/;\s*$/, "").trim();
        const incoming = normalize(data.data.query ?? "");
        const alreadySent = (useAgentModeStore.getState().query || []).some((q) => normalize(q) === incoming);
        if (alreadySent) {
            console.log("Skipping duplicate query execution", data.data.query);
            return;
        }

        addQuery(data.data.query);
        updateIsRunning(true);

        try {
            const queryText: string = data.data.query ?? "";
            const truncated = queryText.length > 500 ? `${queryText.slice(0, 500)}…` : queryText;
            addMessage(`▶️ Running SQL: ${truncated}`);

            const result = await invoke<QueryResult>("run_sqlite_query_raw", {
                connectionId: active,
                sql: data.data.query,
            });

            

            console.log("result: ", result);

            const payload: WebSocketPayload = {
                event: WebSocketEvents.AGENT,
                action: ActionType.UPDATE,
                data: {
                    transactionId: data.data.transactionId,
                    result: result.rows,
                    success: result.rows.length > 0,
                    error: result.rows.length === 0 ? "No rows returned" : undefined
                }
            }

            sendMessage(payload);

            addMessage(`📦 Retrieved ${result.rows.length} row(s). Sending results back to the agent…`);
            updateIsRunning(false);
        } catch (error) {
            console.error("error: ", error);
            const message = error instanceof Error ? error.message : String(error);
            addMessage(`❌ Failed to run SQL: ${message}`);
            const failureResult: TableRow[] = [{
                columns: ["error"],
                rows: [[message]]
            }]
            
            const payload: WebSocketPayload = {
                event: WebSocketEvents.AGENT,
                action: ActionType.UPDATE,
                data: {
                    transactionId: data.data.transactionId,
                    result: failureResult,
                    success: false,
                    error: `Failed to run SQL: ${message}`
                }
            }

            sendMessage(payload);
            updateIsRunning(false);
        }
    }

    const handleResult = (data: WebSocketMessage) => {
        console.log("data: ", data);

        const { query } = data.data as { query: string };

        setEditorSql(query);

        const truncated = query.length > 500 ? `${query.slice(0, 500)}…` : query;
        addMessage(`✅ Generated SQL. It has been inserted into the editor.`);
        addMessage(`🧾 SQL: ${truncated}`);
        addMessage(`💡 Review the SQL and press Run to execute it.`);

        updateIsRunning(false);
    }

    return { userInput, setUserInput, handleSend, handleData, isRunning, messages }  
}
