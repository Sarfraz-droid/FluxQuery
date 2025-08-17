import React, { useState } from 'react'
import { ActionType, AGENT, EventType, TABLE_TYPE, WebSocketEvents, WebSocketMessage, WebSocketPayload, WebSocketTopics } from 'shared';
import { useAppStore } from '../../store';
import { useAgentModeStore } from '../../store/agentMode.store';
import { invoke } from '@tauri-apps/api/core';
import { QueryResult } from '../../types';

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
        addMessage(`Getting Context for the query: ${userInput}`);
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
        
        addQuery(data.data.query);
        updateIsRunning(true);

        try {
            addMessage(`Executing query: ${data.data.query}`);

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
                }
            }

            sendMessage(payload);

            updateIsRunning(false);
        } catch (error) {
            console.error("error: ", error);
            updateIsRunning(false);
        }
    }

    const handleResult = (data: WebSocketMessage) => {
        console.log("data: ", data);

        const { query } = data.data as { query: string };

        setEditorSql(query);

        addMessage(`Generated Query: ${query}`);

        updateIsRunning(false);
    }

    return { userInput, setUserInput, handleSend, handleData, isRunning, messages }  
}
