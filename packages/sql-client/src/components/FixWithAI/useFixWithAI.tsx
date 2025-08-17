/* no react hooks used in this file */
import { useAppStore } from '../../store'
import { ActionType, WebSocketEvents, WebSocketPayload } from 'shared'
import { useFixWithAIStore } from '../../store/fixWithAI.store'

export const useFixWithAI = () => {
    const { sendMessage, editorSql } = useAppStore()
    const { updateIsRunning, isRunning } = useFixWithAIStore()


    const initiateFixWithAI = (extra?: string) => {
        const payload: WebSocketPayload = {
            event: WebSocketEvents.FIX_WITH_AI,
            data: {
                query: editorSql,
                extra: extra ?? ''
            },
            action: ActionType.INITIATE
        }

        updateIsRunning(true)

        sendMessage(payload)
    }

    return {
        initiateFixWithAI,
        isRunning
    }
}
