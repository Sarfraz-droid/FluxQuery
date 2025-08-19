import { ActionType, EventType, WebSocketEvents, WebSocketTopics, type CacheKeyStoreData, type TABLE_TYPE, type WebSocketMessage, type WebSocketPayload } from "shared";
import { PineconeService } from "./Pinecone.service";
import { openRouter } from "./OpenRouter.service";
import { v4 as uuidv4 } from 'uuid';
import { getQueryPrompt } from "./Prompt.service";
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic, parseJsonFromText } from "../utils";
import { CacheModule } from "../module/cache.module";

export class IndexDbService {
    constructor(private readonly data: WebSocketPayload, private readonly deviceId: string) {
        this.data = data;
        this.deviceId = deviceId;
    }

    public async handleIndexDb(data: WebSocketPayload) {
        console.log("handleIndexDb: ", data);
        
        switch (data.action) {
            case ActionType.INITIATE:
                this.handleInitiateIndexDb(data);
                break;
            case ActionType.UPDATE:
                this.handleUpdateIndexDb(data);
                break;
        }
        
    }

    public async handleUpdateIndexDb(data: WebSocketPayload) {
        console.log("handleUpdateIndexDb: ", data);

        const { transactionId, results } = data.data as { transactionId: string, results: any[] };

        const cacheStoreData = CacheModule.get(transactionId);

        cacheStoreData.data["query_results"] = results;

        CacheModule.set(transactionId, JSON.stringify(cacheStoreData));

        
    }

    public async handleInitiateIndexDb(data: WebSocketPayload) {
        console.log("handleInitiateIndexDb: ", data);
        
        const { schema, db_name } = data.data as { schema: TABLE_TYPE.DbSchemaSummary, db_name: string };

        const pineconeService = PineconeService.getInstance();

        console.log("db_name: ", db_name);

        await pineconeService.ensureIndex(db_name);

        for (const table of schema.tables) {
            this.handleTableIndexQuery(table, schema.foreignKeys);
        }
    }

    async handleTableIndexQuery(table: TABLE_TYPE.TableInfo, foreignKeys: TABLE_TYPE.ForeignKeyEdge[]) {
        const prompt = getQueryPrompt(table, foreignKeys);

        console.log("prompt: ", prompt);

        const raw = await openRouter.performQuery("openai/gpt-4o-mini", prompt);
        const obj = parseJsonFromText(raw) as { query?: string[] };
        const queryArray = Array.isArray(obj?.query) ? obj.query : [];

        console.log("response: ", obj);

        const transactionId = uuidv4();

        const message: WebSocketMessage = {
            event: WebSocketEvents.INDEX_DB,
            eventType: EventType.QUERY,
            data: {
                transactionId,
                query: queryArray,
            }
        }

        console.log("message: ", message);

        const cacheStoreData: CacheKeyStoreData = {
            transactionId: transactionId.toString(),
            data: {
                query: queryArray,
            }
        }

        CacheModule.set(transactionId.toString(), JSON.stringify(cacheStoreData));

        WebSocketController.getInstance().publish(formatTopic(WebSocketTopics.INDEX_DB, this.deviceId), message);

        await new Promise((resolve) => {
            console.log("Waiting for query results");
            setTimeout(() => {
                const cacheStoreData = CacheModule.get(transactionId.toString());

                const results = cacheStoreData?.data?.query_results;

                if (results) {
                    console.log("Query results: ", results);
                    resolve(true);
                }
            }, 500);
        });

        const updatedCacheStoreData = CacheModule.get(transactionId.toString());

        const results = updatedCacheStoreData?.data?.query_results;
    }
}