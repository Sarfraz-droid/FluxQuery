import { generateText, streamText } from "ai";
import { LIST_OF_MODELS } from "shared";
import openrouter from "../sdk/vercel.sdk";

export const openRouter = {
    getModels: () => {
        return LIST_OF_MODELS;
    },
    performQuery: async (model: string, prompt: string) => { 
        const response = await generateText({
            model: openrouter(model),
            prompt: prompt
        });

        return (response.text || "").trim();
    },
    performQueryStream: async (
        model: string,
        prompt: string,
        onDelta: (delta: string) => void
    ): Promise<string> => {
        const result = await streamText({
            model: openrouter(model),
            prompt: prompt,
        });

        let fullText = "";
        for await (const delta of result.textStream) {
            const piece = String(delta || "");
            if (piece) {
                fullText += piece;
                try {
                    onDelta(piece);
                } catch {}
            }
        }
        return fullText.trim();
    }
}