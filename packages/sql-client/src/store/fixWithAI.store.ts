import { FIX_WITH_AI } from "shared";
import { create } from "zustand";

type FixWithAIStore = {
    isRunning: boolean;
    currentState: FIX_WITH_AI.FixWithAIStates | null,
    updateCurrentState: (state: FIX_WITH_AI.FixWithAIStates) => void;
    updateIsRunning: (state: boolean) => void
    selectedModel: string;
    updateSelectedModel: (model: string) => void;
}

export const useFixWithAIStore = create<FixWithAIStore>()((set) => {
    return {
        isRunning: false,
        currentState: null,
        selectedModel: "gpt-4o-mini",
        updateCurrentState(state) {
            set({
                currentState: state
            })
        },
        updateIsRunning(state) {
            set({
                isRunning: state
            })
        },
        updateSelectedModel(model) {
            set({
                selectedModel: model
            })
        }
    }
})