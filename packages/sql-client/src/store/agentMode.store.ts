import { AGENT } from "shared";
import { create } from "zustand";

type AgentModeStore = {
    isRunning: boolean;
    currentState: AGENT.AgentStates | null;
    query?: string[];   
    messages?: string[];
    selectedModel: string;
    thinkingText?: string;
    thinkingStartedAt?: number | null;
    updateCurrentState: (state: AGENT.AgentStates) => void;
    updateIsRunning: (state: boolean) => void;
    updateQuery: (query: string[]) => void;
    addQuery: (query: string) => void;
    addMessage: (message: string) => void;
    updateSelectedModel: (model: string) => void;
    resetThinking: () => void;
    appendThinking: (delta: string) => void;
    setThinkingStartedAt: (ts: number | null) => void;
    reset: () => void;
}

export const useAgentModeStore = create<AgentModeStore>()((set) => {
    return {
        isRunning: false,
        currentState: null,
        query: [],
        messages: [],
        selectedModel: "gpt-4o-mini",
        thinkingText: "",
        thinkingStartedAt: null,
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
        updateQuery(query) {
            set({
                query: query
            })
        },
        addQuery(query) {
            set((state) => ({
                query: [...(state?.query || []), query]
            }))
        },
        addMessage(message) {
            set((state) => ({
                messages: [...(state?.messages || []), message]
            }))
        },
        updateSelectedModel(model) {
            set({
                selectedModel: model
            })
        },
        resetThinking() {
            set({
                thinkingText: "",
                thinkingStartedAt: null,
            })
        },
        appendThinking(delta) {
            set((state) => ({
                thinkingText: `${state.thinkingText || ""}${delta}`
            }))
        },
        setThinkingStartedAt(ts) {
            set({
                thinkingStartedAt: ts
            })
        },
        reset() {
            set({
                isRunning: false,
                currentState: null,
                query: [],
                messages: [],
                thinkingText: "",
                thinkingStartedAt: null,
            })
        }
    }
    
})