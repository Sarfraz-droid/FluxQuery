import { AGENT, EventType, WebSocketEvents, WebSocketTopics, type CacheKeyStoreData } from "shared";
import { CacheModule } from "../module/cache.module";
import { openRouter } from "../service/OpenRouter.service";
import z from "zod";
import { AgentPromptService } from "../prompts/agent.prompt.service";
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic } from "../utils";

export class AgentAdapter { 
    public static processAgent(transactionId: string) {
        const cacheStoreData = CacheModule.get(transactionId);

        if (!cacheStoreData) {
            throw new Error("Cache store data not found");
        }

        const data = cacheStoreData.data as AGENT.AgentCacheStoreData;

        console.log("data: ", data);

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

        if(data.query?.length && data.query.length > 0) {
            data.query.push(query);
        } else {
            data.query = [query];
        }

        data.query_revalidation = is_query_required ? 1 : 0;
        data.required_tables = required_tables;
        data.state = is_query_required ? AGENT.AgentStates.QUERY_PROMPT : AGENT.AgentStates.INTENT_PROMPT;
        data.status = AGENT.AgentStatus.PENDING;

        const cacheStoreData: CacheKeyStoreData = {
            transactionId: data.transactionId,
            data: data
        }

        CacheModule.set(data.transactionId, JSON.stringify(cacheStoreData));

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

        CacheModule.set(data.transactionId, JSON.stringify(data));

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