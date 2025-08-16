import { generateObject } from "ai";
import { LIST_OF_MODELS } from "shared";
import openrouter from "../sdk/vercel.sdk";
import z from "zod";

export const openRouter = {
    getModels: () => {
        return LIST_OF_MODELS;
    },
    performQuery: async (model: string, prompt: string, schema: z.ZodObject<any>) => { 
        const resposne = await generateObject({
            model: openrouter(model),
            schema: schema,
            prompt: prompt
        })
        
        return resposne.object;
    }
}