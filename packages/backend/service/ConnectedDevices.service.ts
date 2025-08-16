import type { ServerWebSocket } from "bun";

export class ConnectedDevicesService { 
    private static instance: ConnectedDevicesService | null = null;

    private connectedDevices: string[] = [];

    public static getInstance(): ConnectedDevicesService {
        if(ConnectedDevicesService.instance == null) {
            ConnectedDevicesService.instance = new ConnectedDevicesService();
        }
        return ConnectedDevicesService.instance;
    }

    public async connectToWebSocket(ws: ServerWebSocket) {
        const data = ws.data as any;

        const deviceId = data?.deviceId as string;

        if(deviceId == null) {
            throw new Error("Device ID is required");
        }

        this.connectedDevices.push(deviceId);

        return deviceId;
    }
}