import * as FIX_WITH_AI from "./fix_with_ai.type"

export {FIX_WITH_AI}

export const WEBSOCKET_EVENTS = {
    OPEN: "ws-open",
    MESSAGE: "ws-message",
    CLOSE: "ws-close",
    ERROR: "ws-error",
    SEND: "ws-send",
} as const;

export const LIST_OF_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gemini-2.0-flash",
    "claude-3-5-sonnet",
] as const;

export const WebSocketEvents = {
    FIX_WITH_AI: "fix_with_ai",
} as const;

export const WebSocketTopics = {
    FIX_WITH_AI: "fix_with_ai",
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