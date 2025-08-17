import React, { useState } from 'react'
import { ActionType, EventType, TABLE_TYPE, WebSocketEvents, WebSocketMessage, WebSocketPayload } from 'shared';
import { useAppStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

export const useDbIndexer = () => {
  const [isIndexing, setIsIndexing] = useState(false);
    const { sendMessage, activeConnectionId, connections } = useAppStore();

    const indexDb = async (schema: TABLE_TYPE.DbSchemaSummary, db_name: string) => {
        setIsIndexing(true);
        
        const payload: WebSocketPayload = {
          event: WebSocketEvents.INDEX_DB,
          action: ActionType.INITIATE,
          data: { schema, db_name: db_name },
        }

      sendMessage(payload);
    }
    
    const handleData = (data: WebSocketMessage) => {
        if (data.event !== WebSocketEvents.INDEX_DB) { 
            throw new Error("Invalid event");
        }

        console.log("useDbIndexer data: ", data);

        switch (data.eventType) {
            case EventType.QUERY:
                handleQuery(data);
                break;
        }
    }

    const handleQuery = async (data: WebSocketMessage) => {
        const { transactionId, query } = data.data;

        console.log("query: ", query);

        const results: any[] = [];

        for (const q of query) {
            console.log("q: ", q);
            const result = await invoke("run_sqlite_query_raw", {
                connectionId: activeConnectionId,
                sql: q,
            });

            results.push(result);
        }

        console.log("results: ", results);  

        const payload: WebSocketPayload = {
            event: WebSocketEvents.INDEX_DB,
            action: ActionType.UPDATE,
            data: {
                transactionId,
                results: results.map((r) => r.rows),
            }
        }

        sendMessage(payload);
    }
    
  return { isIndexing, indexDb, handleData }
}
