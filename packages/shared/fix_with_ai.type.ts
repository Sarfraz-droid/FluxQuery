export enum FixWithAIStates {
    INTENT_QUERY = "intent_query",
    TABLE_DETAILS = "table_details",
    QUERY_FIX = "query_fix",
    QUERY_EXECUTION = "query_execution",
    QUERY_RESULT = "query_result",
}

export enum FixWithAIStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface FixWithAIRequest {
    transactionId: string;
}

export interface FixWithAITransactionData {
    transactionId: string;
    state: FixWithAIStates;
    status: FixWithAIStatus;
}

export interface FixWithAIIntentQueryResponse {
    transactionId: string;
    state: FixWithAIStates;
    tables: {
        table: string;
        show_relationships: boolean;
    }[];
}

export interface FixWithAIQueryFixResponse {
    transactionId: string;
    state: FixWithAIStates;
    fixedQuery: string;
}