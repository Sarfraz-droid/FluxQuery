import * as FIX_WITH_AI from "./fix_with_ai.type"
import * as TABLE_TYPE from "./table.type"
import * as AGENT from "./agent.type"



export const WEBSOCKET_EVENTS = {
    OPEN: "ws-open",
    MESSAGE: "ws-message",
    CLOSE: "ws-close",
    ERROR: "ws-error",
    SEND: "ws-send",
} as const;

export const LIST_OF_MODELS = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o-2024-11-20",
    "google/gemini-2.5-flash",
    "anthropic/claude-3.5-sonnet", 
    "mistralai/magistral-medium-2506:thinking",
    "anthropic/claude-3.7-sonnet:thinking"
] as const;

export const WebSocketEvents = {
    FIX_WITH_AI: "fix_with_ai",
    INDEX_DB: "index_db",
    AGENT: "agent",
} as const;

export const WebSocketTopics = {
    FIX_WITH_AI: "fix_with_ai",
    INDEX_DB: "index_db",
    AGENT: "agent",
} as const;

export enum ActionType {
    INITIATE = "initiate",
    STATUS = "status",
    UPDATE = "update",
    COMPLETE = "complete",
    FAIL = "fail",
}

export interface WebSocketPayload {
    event: typeof WebSocketEvents[keyof typeof WebSocketEvents];
    data: any;
    action: ActionType;
}

export enum EventType {
    INFORMATION = "information",
    ERROR = "error",
    QUERY = "query",
    RESULT = "result",
    THINKING = "thinking",
}

export interface WebSocketMessage {
    event: typeof WebSocketEvents[keyof typeof WebSocketEvents];
    eventType: EventType;
    data: any;
}

export interface CacheKeyStoreData {
    transactionId: string;
    data: any;
}

export {FIX_WITH_AI, TABLE_TYPE, AGENT}