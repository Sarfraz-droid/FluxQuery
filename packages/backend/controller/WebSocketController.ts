import type { Server, ServerWebSocket } from "bun";
import { ConnectedDevicesService } from "../service/ConnectedDevices.service";
import { WebSocketEvents, WebSocketTopics, type WebSocketPayload } from "shared";
import { formatTopic } from "../utils";
import { WebSocketService } from "../service/WebSocket.service";

export class WebSocketController { 
    private static instance: WebSocketController;

    public static getInstance(server?: Server) {
        if (!WebSocketController.instance) {
            if (!server) {
                throw new Error("Server is required");
            }

            WebSocketController.instance = new WebSocketController(server);
        }
        return WebSocketController.instance;
    }

    constructor(private readonly server: Server) {
        this.server = server;
    }

    public async handleMessage(ws: ServerWebSocket<any>, message: string) {
        const data = JSON.parse(message) as WebSocketPayload;

        const { deviceId } = ws.data;

        if(data == null) {
            return;
        }

        const payload = data as WebSocketPayload;

        WebSocketService.handleWebSocketPayload(payload, deviceId);

    }

    public async connectToWebSocket(ws: ServerWebSocket<any>) {
        const data = ws.data;

        console.log("Connected to WebSocket: ", data);
        

        if (data == null) {
            console.log('Not Subscribing to FIX_WITH_AI topic for deviceId:', data);
            return;
        }

        const deviceId = await ConnectedDevicesService.getInstance().connectToWebSocket(ws);
        console.log('Subscribing to FIX_WITH_AI topic for deviceId:', deviceId);
        ws.subscribe(formatTopic(WebSocketTopics.FIX_WITH_AI, deviceId));
        ws.subscribe(formatTopic(WebSocketTopics.INDEX_DB, deviceId));
        ws.subscribe(formatTopic(WebSocketTopics.AGENT, deviceId));
        return deviceId;
    }

    public getServer() {
        return this.server;
    }
    
    public publish(topic: string, data: any) {    

        console.log("Publishing to topic: ", topic, " with data: ", data);
        this.server.publish(topic, JSON.stringify(data));
    }
}