import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { LIST_OF_MODELS } from "shared";
import { useFixWithAIStore } from "../../store/fixWithAI.store";
import { useFixWithAI } from "./useFixWithAI";
import { motion } from "framer-motion";

const defaultInstruction = "Please fix the query to be correct and efficient."

export const FixWithAI = () => {
    const { initiateFixWithAI, isRunning } = useFixWithAI();
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState(defaultInstruction);
    const selectedModel = useFixWithAIStore((s) => s.selectedModel);
    const updateSelectedModel = useFixWithAIStore((s) => s.updateSelectedModel);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen]);

    const onSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        initiateFixWithAI(userInput);
        setIsOpen(false);
        setUserInput(defaultInstruction);
    };

    return (
        <>
            <div className="relative">
                <Button
                    variant="secondary"
                    size="md"
                    className="gap-2"
                    onClick={() => setIsOpen(true)}
                    aria-label="Fix with AI"
                    title="Fix with AI"
                    disabled={isRunning}
                >
                    {isRunning ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
                            />
                        </svg>
                    ) : (
                        <>
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                aria-hidden="true"
                            >
                                <path d="M12 3l1.5 3 3 1.5-3 1.5L12 12l-1.5-3L7.5 7.5 10.5 6 12 3z" />
                                <path d="M6 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
                                <path d="M16 14l.8 1.6L18.4 16l-1.6.8L16 18.4l-.8-1.6-1.6-.8 1.6-.8.8-1.6z" />
                            </svg>
                            <span className="font-mono">Fix with AI</span>
                        </>
                    )}
                </Button>
                {isOpen && !isRunning && (
                    <motion.div
                        className="absolute top-[-120px] left-[-150px] right-0 bottom-[0px] pl-2 px-1 py-1 font-semibold bg-gray-900 text-gray-100 border border-gray-700 rounded-md font-mono flex flex-col"
                        initial={{
                            y: 100,
                            opacity: 0
                        }}
                        animate={{
                            y: 0,
                            opacity: 1
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 0.5
                        }}
                    >
                        <textarea
                            className="flex-1 resize-none w-full text-xs mt-2 focus:ring-0 focus:outline-none"
                            placeholder="Enter query instructions here"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        />
                        <div className="flex justify-between items-center pt-2 gap-2">
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
                                className="my-0 py-0"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                            >
                                <span>Cancel</span>
                            </Button>
                            <Button
                                size="xs"
                                className="my-0 py-0"
                                onClick={onSubmit}
                            >
                                <span>Send</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    );
};
