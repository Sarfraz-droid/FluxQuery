import { Pinecone } from "@pinecone-database/pinecone";

/**
 * PineConeSDK is a lazy singleton wrapper around the Pinecone client.
 * Use `PineConeSDK.getInstance()` or `getPinecone()` to access the client.
 */
class PineConeSDK {
    private static instance: PineConeSDK | null = null;
    private static model: string = "text-embedding-3-small";
    private readonly pinecone: Pinecone;

    private constructor() {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error("PINECONE_API_KEY is not set in environment");
        }
        this.pinecone = new Pinecone({ apiKey });
    }

    public static getInstance(): PineConeSDK {
        if (!PineConeSDK.instance) {
            PineConeSDK.instance = new PineConeSDK();
        }
        return PineConeSDK.instance;
    }

    public getClient(): Pinecone {
        return this.pinecone;
    }

    public async generateEmbeddings(prompt: string) {
        const embedding = await this.pinecone.inference.embed(PineConeSDK.model, [prompt]);
        return embedding.data;
    }

    public async createIndex(indexName: string) {
        return await this.pinecone.createIndex({
            name: indexName,
            dimension: 1536,
            metric: "cosine",
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }         
            }
        })
    }

    public async upsert(embeddings: number[], metadata: Record<string, any>, id: string, indexName: string) {
        return await this.pinecone.index(indexName).upsert([
            {
                id: id,
                values: embeddings,
                metadata: metadata
            }
        ]);
    }

    public async query(indexName: string, vector: number[], topK: number = 5) {
        return await this.pinecone.index(indexName).query({
            topK,
            vector,
            includeMetadata: true
        });
    }
}

export default PineConeSDK;

export function getPinecone(): Pinecone {
    return PineConeSDK.getInstance().getClient();
}
