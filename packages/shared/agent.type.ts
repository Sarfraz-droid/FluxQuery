import type { TABLE_TYPE } from ".";

export enum AgentStates {
    INTENT_PROMPT = "intent_prompt",
    QUERY_PROMPT = "query_prompt",
    QUERY_RESULT = "query_result",
}

export interface AgentCacheStoreData {
    transactionId: string;
    deviceId: string;
    prompt: string;
    state: AgentStates;
    status: AgentStatus;
    schema: TABLE_TYPE.DbSchemaSummary;
    required_tables?: string[];
    query?: string[];
    query_result?: TABLE_TYPE.TableRow[][];
    query_revalidation?: number;
    final_query?: string;
    model: string;
}

export enum AgentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
}