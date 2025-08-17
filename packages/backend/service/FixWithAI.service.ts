import z, { uuidv4 } from "zod";
import { ActionType, EventType, TABLE_TYPE, WebSocketEvents, WebSocketTopics, type CacheKeyStoreData, type WebSocketMessage, type WebSocketPayload } from "shared";
import { v4 as uuid } from "uuid";
import {FIX_WITH_AI} from "shared";
import { openRouter } from "./OpenRouter.service";
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic } from "../utils";
import { CacheModule } from "../module/cache.module";
import { generateFixWithAiQueryPrompt, getTableFlashCardPrompt } from "./Prompt.service";

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
        console.log("handleFixWithAI: ", data.action);
        switch (data.action) {
            case ActionType.INITIATE:
                this.initiateFixWithAI(data);
                break;
            case ActionType.UPDATE:
                this.handleUpdateFixWithAI(data);
                break;
        }
    }

    public async handleUpdateFixWithAI(data: WebSocketPayload) {
        console.log("updateFixWithAI: ", data.action);

        const transactionId = data.data?.transactionId;

        if (!transactionId) 
        {
            throw new Error("Transaction id does not exist");
        }

        const payload = data?.data;
        

        switch (payload.state) {
            case FIX_WITH_AI.FixWithAIStates.TABLE_DETAILS:
                this.handleTableDetails(data);
                break;
        }
    }

    public async handleTableDetails(data: WebSocketPayload) {
        console.log("handleTableDetails: ", data.action);

        const payload = data?.data;

        const tables = payload?.tables as TABLE_TYPE.DbSchemaSummary[];

        const cachedResponse = CacheModule.get(payload?.transactionId);

        if (!cachedResponse) {
            throw new Error("Cached response does not exist");
        }


        cachedResponse.data.state = FIX_WITH_AI.FixWithAIStates.TABLE_DETAILS;
        cachedResponse.data["tables"] = tables;

        CacheModule.set(payload?.transactionId, JSON.stringify(cachedResponse));

        this.generateQueryFix(payload?.transactionId);
        

        // const tableFlashCardPrompts = tables.map((table) => getTableFlashCardPrompt(table.tables[0], table.foreignKeys));

        // const tableFlashCardPrompt = tableFlashCardPrompts.join("\n ------------- \n");
        

    }

    public async generateQueryFix(transactionId: string) {
        console.log("generateQueryFix: ", transactionId);

        const cachedResponse = CacheModule.get(transactionId);

        if (!cachedResponse) {
            throw new Error("Cached response does not exist");
        }

        const query = cachedResponse.data.query;
        const tables = cachedResponse.data.tables;
        const extra = cachedResponse.data.extra;

        const finalGeneratePrompt = generateFixWithAiQueryPrompt(query, tables, extra);

        const response = await openRouter.performQuery(
            "openai/gpt-4o-mini",
            finalGeneratePrompt,
            z.object({
                query: z.string(),
            })
        );

        console.log("FixWithAIResponse: ", response);

        const server = WebSocketController.getInstance().getServer();

        if (!server) {

            throw new Error("Server is required");
        }

        const fixWithAIResponse: FIX_WITH_AI.FixWithAIQueryFixResponse = {
            state: FIX_WITH_AI.FixWithAIStates.QUERY_FIX,
            transactionId: uuid(),
            fixedQuery: response.query as string,
        }

        const message: WebSocketMessage = {
            event: WebSocketEvents.FIX_WITH_AI,
            eventType: EventType.INFORMATION,
            data: fixWithAIResponse
        }

        WebSocketController.getInstance().publish(formatTopic(WebSocketTopics.FIX_WITH_AI, this.deviceId), message);
    }

    public async initiateFixWithAI(data: WebSocketPayload) {

        console.log("initiateFixWithAI: ", data.action);
        const { data: payloadData } = data

        const { query, extra } = payloadData as { query: string; extra: string; };
    
    
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
                query: query,
                extra: extra
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

