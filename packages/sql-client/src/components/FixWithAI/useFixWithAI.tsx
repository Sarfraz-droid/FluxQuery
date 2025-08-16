import React from 'react'
import { useAppStore } from '../../store'
import { ActionType, WebSocketEvents, WebSocketPayload } from 'shared'

export const useFixWithAI = () => {
    const { sendMessage, editorSql } = useAppStore()

    const initiateFixWithAI = () => {
        const payload: WebSocketPayload = {
            event: WebSocketEvents.FIX_WITH_AI,
            data: {
                query: editorSql
            },
            action: ActionType.INITIATE
        }

        sendMessage(JSON.stringify(payload))
    }

    return {
        initiateFixWithAI
    }
}
