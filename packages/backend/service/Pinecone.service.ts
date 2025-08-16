import PineConeSDK from "../sdk/pinecone.sdk";

export class PineconeService {
    private static instance: PineconeService | null = null;
    private pinecone: PineConeSDK;

    public static getInstance(): PineconeService {
        if (!PineconeService.instance) {
            PineconeService.instance = new PineconeService();
        }
        return PineconeService.instance;
    }

    private constructor() {
        this.pinecone = PineConeSDK.getInstance();
    }

    
}