import { openRouter } from "../service/OpenRouter.service";

export const getModels = async () => { 
    return await openRouter.getModels();
}
    