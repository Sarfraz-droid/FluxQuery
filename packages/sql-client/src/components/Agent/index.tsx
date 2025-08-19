import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store";
import { useAgentMode } from "./useAgentMode";
import { TypewriterText } from "./TypewriterText";
import { Select } from "../ui/select";
import { LIST_OF_MODELS } from "shared";
import { useAgentModeStore } from "../../store/agentMode.store";

export const AgentMode = () => {
    const { userInput, setUserInput, handleSend, isRunning, messages } =
        useAgentMode();
    const wsStatus = useAppStore((s) => s.wsStatus);
    const selectedModel = useAgentModeStore((s) => s.selectedModel);
    const updateSelectedModel = useAgentModeStore((s) => s.updateSelectedModel);
    const thinkingText = useAgentModeStore((s) => s.thinkingText);
    const thinkingStartedAt = useAgentModeStore((s) => s.thinkingStartedAt);

    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        let interval: number | null = null;
        if (isRunning && thinkingStartedAt) {
            setElapsed(Math.floor((Date.now() - thinkingStartedAt) / 1000));
            interval = window.setInterval(() => {
                setElapsed(Math.floor((Date.now() - (thinkingStartedAt || Date.now())) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => {
            if (interval) {
                window.clearInterval(interval);
            }
        };
    }, [isRunning, thinkingStartedAt]);

    return (
        <div className="font-mono h-full flex flex-col">
            <div className="flex-1 flex flex-col gap-3 h-[80vh] overflow-y-auto pb-3">
                {isRunning && (
                    <div className="text-xs text-gray-300">
                        <span>🧩 Thinking… {elapsed}s</span>
                        {thinkingText && thinkingText.length > 0 && (
                            <pre className="mt-2 bg-gray-950 border border-gray-800 rounded-sm p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                                {thinkingText}
                            </pre>
                        )}
                    </div>
                )}
                {messages?.map((message, index) => {
                    const isSqlMessage =
                        message.startsWith("🧾 SQL:") ||
                        message.startsWith("▶️ Running SQL:");
                    if (isSqlMessage) {
                        const label = message.startsWith("▶️")
                            ? "Running SQL"
                            : "SQL";
                        const colonIndex = message.indexOf(":");
                        const sql =
                            colonIndex >= 0
                                ? message.slice(colonIndex + 1).trim()
                                : message;
                        return (
                            <div key={index} className="flex flex-col gap-1">
                                <div className="text-[10px] uppercase tracking-wide text-gray-400">
                                    {label}
                                </div>
                                <div className="relative">
                                    <pre className="bg-gray-950 border border-gray-800 rounded-sm p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                                        {sql}
                                    </pre>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        className="absolute top-1 right-1 p-0  my-0 py-0 font-mono !bg-gray-900 border-gray-800 border-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(sql);
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                            />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={index} className="flex flex-col">
                            <TypewriterText
                                className="text-xs"
                                text={message}
                                speedMsPerChar={6}
                                startDelayMs={80}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex-none h-[150px]">
                <div className="h-[150px] w-full bg-gray-900 rounded-sm flex flex-col p-2 gap-2 border-gray-800 border-2">
                    <textarea
                        className="w-full resize-none flex-1 focus:outline-none text-xs"
                        placeholder='Describe what you want (e.g., "Top 10 customers by revenue this month")'
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                    />
                    <div className="w-full flex gap-2 items-center justify-between">
                        <Select
                            value={selectedModel}
                            onChange={(e) => updateSelectedModel(e.target.value)}
                            className="font-mono bg-gray-950 border-gray-800 text-xs text-gray-200 h-8 py-0 px-2 rounded-sm"
                        >
                            {LIST_OF_MODELS.map((m) => (
                                <option key={m} value={m} className="bg-gray-900 text-gray-100">
                                    {m}
                                </option>
                            ))}
                        </Select>
                        <Button
                            size="xs"
                            className="my-0 py-0 font-mono"
                            onClick={() => {
                                handleSend();
                            }}
                            disabled={isRunning || wsStatus !== "connected"}
                        >
                            <span>
                                {isRunning
                                    ? "Thinking…"
                                    : wsStatus !== "connected"
                                    ? "Offline"
                                    : "Ask Agent"}{" "}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
