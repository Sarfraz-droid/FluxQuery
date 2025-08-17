import { useEffect, useRef } from 'react'
import { WEBSOCKET_EVENTS, WebSocketEvents } from 'shared';
import { useFixWithAI } from './useFixWithAI';
import { useDbIndexer } from './useDbIndexer';
import { useAgentMode } from '../components/Agent/useAgentMode';

export const useWebSocket = () => {

    const FixWithAI = useFixWithAI();
    const fixWithAIRef = useRef(FixWithAI);
    const indexDb = useDbIndexer();
    const indexDbRef = useRef(indexDb);
    const agent = useAgentMode();
    const agentRef = useRef(agent);
    // Keep ref updated with latest handlers without re-binding listeners
    useEffect(() => {
        fixWithAIRef.current = FixWithAI;
        indexDbRef.current = indexDb;
        agentRef.current = agent;
    }, [FixWithAI, indexDb, agent]);

    useEffect(() => {
        const onOpen = () => {
            console.log("WebSocket opened");
        };

        const onMessage = (event: any) => {
            const { detail } = event;
            console.log('Filtering Web socket event at: ', detail.event);
            switch (detail.event) {
                case WebSocketEvents.FIX_WITH_AI:
                    fixWithAIRef.current.handleData(detail);
                    break;
                case WebSocketEvents.INDEX_DB:
                    indexDbRef.current.handleData(detail);
                    break;
                case WebSocketEvents.AGENT:
                    agentRef.current.handleData(detail);
                    break;
            }
        };

        const onClose = () => {
            console.log("WebSocket closed");
        };

        const onError = () => {
            console.log("WebSocket error");
        };

        window.addEventListener(WEBSOCKET_EVENTS.OPEN, onOpen);
        window.addEventListener(WEBSOCKET_EVENTS.MESSAGE, onMessage);
        window.addEventListener(WEBSOCKET_EVENTS.CLOSE, onClose);
        window.addEventListener(WEBSOCKET_EVENTS.ERROR, onError);

        return () => {
            window.removeEventListener(WEBSOCKET_EVENTS.OPEN, onOpen);
            window.removeEventListener(WEBSOCKET_EVENTS.MESSAGE, onMessage);
            window.removeEventListener(WEBSOCKET_EVENTS.CLOSE, onClose);
            window.removeEventListener(WEBSOCKET_EVENTS.ERROR, onError);
        };
    }, []);
}
