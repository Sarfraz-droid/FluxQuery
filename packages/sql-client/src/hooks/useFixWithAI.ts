import { invoke } from '@tauri-apps/api/core';
import React, { useMemo } from 'react'
import { ActionType, FIX_WITH_AI, WebSocketEvents, WebSocketMessage, WebSocketPayload  } from 'shared';
import { useAppStore } from '../store';
import { useFixWithAIStore } from '../store/fixWithAI.store';

export const useFixWithAI = () => {
    const setEditorSql = useAppStore((s) => s.setEditorSql);
    const sendMessage = useAppStore((s) => s.sendMessage);
    const activeConnectionId = useAppStore((s) => s.activeConnectionId);
    const connections = useAppStore((s) => s.connections);

    const { updateIsRunning, updateCurrentState, isRunning } = useFixWithAIStore()

    const active = useMemo(() => connections.find((c) => c.id === activeConnectionId), [connections, activeConnectionId]);
  
    const handleData = (data: WebSocketMessage) => {
        if (data.event != WebSocketEvents.FIX_WITH_AI) {
            throw new Error("invalid function handle called");
        }
        const payloadData = data.data;

        updateCurrentState(payloadData.state)

        switch (payloadData.state) {
            case FIX_WITH_AI.FixWithAIStates.INTENT_QUERY:
                handleIntentQuery(payloadData);        
                break;
            case FIX_WITH_AI.FixWithAIStates.QUERY_FIX:
                handleQueryFix(payloadData);
                break;
        }
    }

    const handleIntentQuery = async (payload: FIX_WITH_AI.FixWithAIIntentQueryResponse) => {
        const tables = payload?.tables;
        const tableInfos = []

        for (const table of tables) {
            const data = await getTableData(table);
            console.log("Table Data: ", data);

            tableInfos.push(data);
        }

        const handleIntentQuery: WebSocketPayload = {
            event: WebSocketEvents.FIX_WITH_AI,
            action: ActionType.UPDATE,
            data: {
                state: FIX_WITH_AI.FixWithAIStates.TABLE_DETAILS,
                transactionId: payload.transactionId,
                tables: tableInfos
            }
        }

        sendMessage(handleIntentQuery)
    }

    const getTableData = async (table: FIX_WITH_AI.FixWithAIIntentQueryResponse["tables"][0]) => {
        const data = await invoke('sqlite_table_summary', {
            connectionId: active?.id || "",
            tableName: table.table
        })

        return data;
    }

    const handleQueryFix = async (payload: FIX_WITH_AI.FixWithAIQueryFixResponse) => {
        const fixedQuery = payload?.fixedQuery;

        setEditorSql(fixedQuery);   
        updateIsRunning(false)
    }

    return {
        handleData
    };
}
