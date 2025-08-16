import z, { uuidv4 } from "zod";
import { ActionType, EventType, WebSocketEvents, WebSocketTopics, type CacheKeyStoreData, type WebSocketMessage, type WebSocketPayload } from "shared";
import { v4 as uuid } from "uuid";
import {FIX_WITH_AI} from "shared";
import { openRouter } from "./OpenRouter.service";
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic } from "../utils";
import { CacheModule } from "../module/cache.module";

const getPrompt = (step: FIX_WITH_AI.FixWithAIStates, query: string) => {
    switch (step) {
        case FIX_WITH_AI.FixWithAIStates.INTENT_QUERY:
            return `
                You are a helpful assistant that can help with fixing SQL queries.
                
                You now have to find the intent of the query. And get required details of the tables from the user.

                return the response in the following format in array:

                [
                    {
                        "table": "table_name",
                        "show_relationships": true,
                    },
                    ...
                ]

                Query: ${query}                
            `
    }
}

export class FixWithAIService {
    public deviceId: string;
    public data: WebSocketPayload;

    constructor(data: WebSocketPayload, deviceId: string) {
        this.deviceId = deviceId;
        this.data = data;
    }

    public handleFixWithAI(data: WebSocketPayload) {
        switch (data.action) {
            case ActionType.INITIATE:
                this.initiateFixWithAI(data);
                break;
        }
    }

    public async initiateFixWithAI(data: WebSocketPayload) {
        const { data: payloadData } = data

        const { query } = payloadData as { query: string };
    
    
        const prompt = getPrompt(FIX_WITH_AI.FixWithAIStates.INTENT_QUERY, query);

        console.log("Prompt: ", prompt);
    
        if (!prompt) {
            throw new Error("Prompt is required");
        }
    
        const response = await openRouter.performQuery(
            "openai/gpt-4o-mini",
            prompt,
            z.object({
                tables: z.array(z.object({
                    table: z.string(),
                    show_relationships: z.boolean(),
                }))
            })
        )
    
        console.log("FixWithAIResponse: ", response);
    
        const server = WebSocketController.getInstance().getServer();
    
        if (!server) {
            throw new Error("Server is required");
        }
    
        const fixWithAIResponse: FIX_WITH_AI.FixWithAIIntentQueryResponse = {
            state: FIX_WITH_AI.FixWithAIStates.INTENT_QUERY,
            transactionId: uuid(),
            tables: response.tables as { table: string; show_relationships: boolean }[]
        }

        const message: WebSocketMessage = {
            event: WebSocketEvents.FIX_WITH_AI,
            eventType: EventType.INFORMATION,
            data: fixWithAIResponse
        }

        const cacheStoreData: CacheKeyStoreData = {
            transactionId: fixWithAIResponse.transactionId,
            data: {
                state: FIX_WITH_AI.FixWithAIStates.INTENT_QUERY,
                query: query
            }
        }

        CacheModule.set(fixWithAIResponse.transactionId, JSON.stringify(cacheStoreData));
        

        WebSocketController.getInstance().publish(formatTopic(WebSocketTopics.FIX_WITH_AI, this.deviceId), message);
        
    }

    public async statusFixWithAI(data: WebSocketPayload) {
        const { data: payloadData } = data;
    }
    
    public async updateFixWithAI(data: WebSocketPayload) {
        const { data: payloadData } = data;
    }

    public async completeFixWithAI(data: WebSocketPayload) {
        const { data: payloadData } = data;
    }

    public async failFixWithAI(data: WebSocketPayload) {
        const { data: payloadData } = data;
    }
}

const initiateFixWithAI = async (data: WebSocketPayload) => { 


}


/**
 * Intent Query -> Table Details -> Query Fix -> Query Execution -> Query Result
 */

