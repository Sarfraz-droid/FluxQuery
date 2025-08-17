import { WebSocketEvents, type WebSocketPayload } from "shared";
import { FixWithAIService } from "./FixWithAI.service";
import { IndexDbService } from "./IndexDbService.service";
import { AgentService } from "./Agent.service";

export class WebSocketService { 
    public static async handleWebSocketPayload(data: WebSocketPayload, deviceId: string) {
        console.log('handleWebSocketPayload: ', data.event);
        switch(data.event) {
            case WebSocketEvents.FIX_WITH_AI:
                new FixWithAIService(data, deviceId).handleFixWithAI(data);
                break;
            case WebSocketEvents.INDEX_DB:
                new IndexDbService(data, deviceId).handleIndexDb(data);
                break;
            case WebSocketEvents.AGENT:
                new AgentService(data, deviceId).handleAgent(data);
                break;
        }
    }
}