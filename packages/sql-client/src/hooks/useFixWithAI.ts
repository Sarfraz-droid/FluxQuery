import { invoke } from '@tauri-apps/api/core';
import React from 'react'
import { FIX_WITH_AI, WEBSOCKET_EVENTS,  } from 'shared';
import { useAppStore } from '../store';

export const useFixWithAI = () => {
    const activeConnectionId = useAppStore((s) => s.activeConnectionId);

    const handleData = (data: WebSocketMessage) => {
        if (data.event != WebSocketEvents.FIX_WITH_AI) {
            throw new Error("invalid function handle called");
        }

        const { data: payloadData } = data.data;

        switch (payloadData.state) {
            case FIX_WITH_AI.FixWithAIStates.INTENT_QUERY:
                handleIntentQuery(payloadData);        
                break;
        }
    }

    const handleIntentQuery = (payload: FIX_WITH_AI.FixWithAIIntentQueryResponse) => {
        const tables = payload?.tables;

        tables.forEach((table) => {
            
        })
    }

    const getTableData = async (table: FIX_WITH_AI.FixWithAIIntentQueryResponse["tables"][0]) => {
        const data = invoke('sqlite_table_summary', {
            connectionId:activeConnectionId
        })
    }

    return {
        handleData
    };
}
