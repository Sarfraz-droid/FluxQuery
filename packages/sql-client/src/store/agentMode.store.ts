import { AGENT } from "shared";
import { create } from "zustand";

type AgentModeStore = {
    isRunning: boolean;
    currentState: AGENT.AgentStates | null;
    query?: string[];   
    messages?: string[];
    updateCurrentState: (state: AGENT.AgentStates) => void;
    updateIsRunning: (state: boolean) => void;
    updateQuery: (query: string[]) => void;
    addQuery: (query: string) => void;
    addMessage: (message: string) => void;
    reset: () => void;
}

export const useAgentModeStore = create<AgentModeStore>()((set) => {
    return {
        isRunning: false,
        currentState: null,
        query: [],
        messages: [],
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
        reset() {
            set({
                isRunning: false,
                currentState: null,
                query: [],
                messages: []
            })
        }
    }
    
})