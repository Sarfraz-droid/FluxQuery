import { WebSocketEvents, type WebSocketPayload } from "shared";
import { FixWithAIService } from "./FixWithAI.service";

export class WebSocketService { 
    public static async handleWebSocketPayload(data: WebSocketPayload, deviceId: string) {
        switch(data.event) {
            case WebSocketEvents.FIX_WITH_AI:
                new FixWithAIService(data, deviceId).handleFixWithAI(data);
                break;
        }
    }
}