import { ActionType, WebSocketEvents, EventType, type WebSocketPayload, type WebSocketMessage, WebSocketTopics, type CacheKeyStoreData, AGENT, TABLE_TYPE } from "shared";
import { v4 as uuidv4 } from 'uuid';
import { WebSocketController } from "../controller/WebSocketController";
import { formatTopic } from "../utils";
import { CacheModule } from "../module/cache.module";
import { AgentAdapter } from "../adapters/agent.adapter";

export class AgentService {
    public deviceId: string;
    public data: WebSocketPayload;

    constructor(data: WebSocketPayload, deviceId: string) {
        this.deviceId = deviceId;
        this.data = data;
    }

    public handleAgent(data: WebSocketPayload) {
        switch (data.action) {
            case ActionType.INITIATE:
                this.handleInitiateAgent(data);
                break;
            case ActionType.UPDATE:
                this.handleUpdateAgent(data);
                break;
        }
    }

    public handleInitiateAgent(data: WebSocketPayload) {
        const { prompt, schema } = data.data as { prompt: string, schema: TABLE_TYPE.DbSchemaSummary };

        const transactionId = uuidv4();

        const cacheData: AGENT.AgentCacheStoreData = {
            transactionId,
            deviceId: this.deviceId,
            prompt,
            state: AGENT.AgentStates.INTENT_PROMPT,
            status: AGENT.AgentStatus.PENDING,
            schema,
        }

        const cacheStoreData: CacheKeyStoreData = {
            transactionId,
            data: cacheData
        }   

        CacheModule.set(transactionId, JSON.stringify(cacheStoreData));

        AgentAdapter.processAgent(transactionId);
        
    }

    public handleUpdateAgent(data: WebSocketPayload) {
        console.log("handleUpdateAgent: ", data);

        const { transactionId, result, success, error} = data.data as { transactionId: string, result: TABLE_TYPE.TableRow[], success: boolean, error: string };

        const cacheData = CacheModule.get(transactionId);

        if (!cacheData) {
            throw new Error("Cache data not found");
        }

        const agentData = cacheData.data as AGENT.AgentCacheStoreData;
        console.log("cacheData: ", agentData);
        

        console.log("result: ", result);

        if(success) {
            agentData.query_result = [...(agentData?.query_result || []), result];
        } else {
            const errorResult: TABLE_TYPE.TableRow[] = [{
                columns: ["error"],
                rows: [[error]]
            }]
            agentData.query_result = [...(agentData?.query_result || []), errorResult];
            agentData.state = AGENT.AgentStates.INTENT_PROMPT;
            agentData.query_revalidation = 1;
        }

        cacheData.data = agentData;

        CacheModule.set(transactionId, JSON.stringify(cacheData));

        

        AgentAdapter.processAgent(transactionId);
    }
}