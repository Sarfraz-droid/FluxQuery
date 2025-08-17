import { AGENT, EventType, WebSocketEvents, WebSocketTopics, type CacheKeyStoreData } from "shared";
import { CacheModule } from "../module/cache.module";
import { openRouter } from "../service/OpenRouter.service";
import z from "zod";
import { AgentPromptService } from "../prompts/agent.prompt.service";
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic } from "../utils";

export class AgentAdapter { 
    private static readonly MAX_HELPER_QUERIES = 5;

    private static normalizeQuery(sql?: string): string {
        return (sql || "")
            .toLowerCase()
            .replace(/--.*$/gm, "") // strip single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, "") // strip block comments
            .replace(/\s+/g, " ")
            .replace(/;\s*$/, "")
            .trim();
    }
    public static processAgent(transactionId: string) {
        const cacheStoreData = CacheModule.get(transactionId);

        if (!cacheStoreData) {
            throw new Error("Cache store data not found");
        }



        const data = cacheStoreData.data as AGENT.AgentCacheStoreData;

        console.log("data: ", data.state);

        switch (data.state) {
            case AGENT.AgentStates.INTENT_PROMPT:
                this.processQueryPrompt(data);
                break;
            case AGENT.AgentStates.QUERY_PROMPT:
                this.processQueryExecution(data);
                break;
        }
    }

    public static async processQueryPrompt(data: AGENT.AgentCacheStoreData) {
        const prompt = data.prompt;

        const intentPrompt = AgentPromptService.getIntentPrompt(prompt, data.schema, data.query || [], data.query_result || []);

        console.log("query prompt: ", intentPrompt);

        const response = await openRouter.performQuery(
            "openai/gpt-4o-mini",
            intentPrompt,
            z.object({
                query: z.string(),
                is_query_required: z.boolean(),
                required_tables: z.array(z.string())
            })
        );

        const { query, is_query_required, required_tables } = response as { query: string, is_query_required: boolean, required_tables: string[] };

        const normalizedIncoming = this.normalizeQuery(query);
        const existingQueries = data.query || [];
        const hasDuplicate = existingQueries
            .map((q) => this.normalizeQuery(q))
            .includes(normalizedIncoming);

        // Decide whether to continue helper queries or move to finalization
        const reachedLimit = (existingQueries?.length || 0) >= this.MAX_HELPER_QUERIES;
        const shouldFinalize = reachedLimit || hasDuplicate;

        // Maintain history only if it's a genuinely new helper query
        if (!hasDuplicate) {
            if (existingQueries?.length && existingQueries.length > 0) {
                existingQueries.push(query);
                data.query = existingQueries;
            } else {
                data.query = [query];
            }
        }

        data.query_revalidation = is_query_required ? 1 : 0;
        data.required_tables = required_tables;
        data.state = shouldFinalize ? AGENT.AgentStates.QUERY_PROMPT : AGENT.AgentStates.INTENT_PROMPT;
        data.status = AGENT.AgentStatus.PENDING;

        const cacheStoreData: CacheKeyStoreData = {
            transactionId: data.transactionId,
            data: data
        }

        CacheModule.set(data.transactionId, JSON.stringify(cacheStoreData));

        if (shouldFinalize) {
            // Skip publishing another helper query; proceed to final query generation
            return this.processQueryExecution(data);
        }

        WebSocketController.getInstance().publish(formatTopic(WebSocketTopics.AGENT, data.deviceId), {
            event: WebSocketEvents.AGENT,
            eventType: EventType.QUERY,
            data: {
                transactionId: data.transactionId,
                query
            }
        });
    }

    public static async processQueryExecution(data: AGENT.AgentCacheStoreData) {

        const queryExecutionPrompt = AgentPromptService.getQueryExecutionPrompt(data);

        console.log("query execution prompt: ", queryExecutionPrompt);

        const response = await openRouter.performQuery(
            "openai/gpt-4o-mini",
            queryExecutionPrompt,
            z.object({
                query: z.string()
            })
        );
        
        const { query } = response as { query: string };

        data.final_query = query;
        data.state = AGENT.AgentStates.QUERY_RESULT;
        data.status = AGENT.AgentStatus.COMPLETED;

        const cacheStoreData: CacheKeyStoreData = {
            transactionId: data.transactionId,
            data
        }

        CacheModule.set(data.transactionId, JSON.stringify(cacheStoreData));

        WebSocketController.getInstance().publish(formatTopic(WebSocketTopics.AGENT, data.deviceId), {
            event: WebSocketEvents.AGENT,
            eventType: EventType.RESULT,
            data: {
                transactionId: data.transactionId,
                query: data.final_query,
            }
        });
    }
}