import PineConeSDK from "../sdk/pinecone.sdk";
import type { TABLE_TYPE } from "shared";
import { getTableFlashCardPrompt } from "./Prompt.service";

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

    public async ensureIndex(indexName: string) {
        try {
            await this.pinecone.createIndex(indexName);
        } catch (error: any) {
            // Ignore if index already exists
            const message = String(error?.message ?? "");
            if (!message.toLowerCase().includes("already exists")) {
                throw error;
            }
        }
    }

    private async embed(text: string): Promise<number[]> {
        const data = await this.pinecone.generateEmbeddings(text);
        const first = Array.isArray(data) ? data[0] : undefined;
        const values: number[] | undefined = (first as any)?.values;
        if (!values || values.length === 0) {
            throw new Error("Failed to generate embeddings");
        }
        return values;
    }

    public async indexSchema(indexName: string, schema: TABLE_TYPE.DbSchemaSummary) {
        if (!indexName) {
            throw new Error("indexName is required");
        }

        await this.ensureIndex(indexName);

        const upserts: { table: string; id: string }[] = [];

        for (const table of schema.tables) {
            const relatedFks = schema.foreignKeys.filter(
                (fk) => fk.fromTable === table.name || fk.toTable === table.name
            );

            const content = getTableFlashCardPrompt(table, relatedFks);

            const vector = await this.embed(content);

            const metadata = {
                type: "table",
                table: table.name,
                content,
                columns: table.columns,
                keys: table.keys,
                relatedTables: Array.from(
                    new Set(
                        relatedFks.flatMap((fk) => [fk.fromTable, fk.toTable]).filter((t) => t !== table.name)
                    )
                ),
            } as Record<string, any>;

            const id = `${indexName}:${table.name}`;
            await this.pinecone.upsert(vector, metadata, id, indexName);
            upserts.push({ table: table.name, id });
        }

        return { indexName, upserts };
    }

    public async searchTables(indexName: string, query: string, topK: number = 5) {
        if (!indexName) throw new Error("indexName is required");
        if (!query) throw new Error("query is required");

        const vector = await this.embed(query);
        const result = await this.pinecone.query(indexName, vector, topK);

        const matches = (result.matches ?? []).map((m: any) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata,
        }));
        return { indexName, query, topK, matches };
    }
}