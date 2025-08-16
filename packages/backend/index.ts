import "dotenv/config";
import { WebSocketController } from "./controller/WebSocketController";

const PORT = Number(process.env.PORT || 8787);

// CORS and JSON helpers
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


export const server = Bun.serve({
    port: PORT,
    websocket: {
        open(ws) {
            console.log("WebSocket opened");
            
            webSocketController.connectToWebSocket(ws);
        },
        message(ws, message) {
            console.log("Received message:", message);
            webSocketController.handleMessage(ws, message as string);
        },
        close(ws) {
            console.log("WebSocket closed");
        }
    },
    fetch(req, server) { 
        const url = new URL(req.url);

        const params = url.searchParams;

        const deviceId = params.get("deviceId");

        if (server.upgrade(req, { data: { deviceId } })) {
            console.log("Upgraded to WebSocket");
            return;
        }
    }
});

const webSocketController = WebSocketController.getInstance(server);

console.log(`HTTP backend listening on http://localhost:${PORT}`);