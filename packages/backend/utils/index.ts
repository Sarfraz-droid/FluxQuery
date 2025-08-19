export const formatTopic = (topic: string, ...args: string[]) => {
    return topic.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = parseInt(index);
        return args[argIndex] || match;
    });
}

export const parseJsonFromText = (text: string): any => {
    const content = (text || "").trim();
    // Extract triple-fenced json/code blocks first
    const fenceRegex = /```(?:json|JSON)?\n([\s\S]*?)\n```/m;
    const fenceMatch = content.match(fenceRegex);
    const candidate = fenceMatch ? fenceMatch[1].trim() : content;
    // Remove leading/trailing markdown artifacts
    const cleaned = candidate
        .replace(/^```[a-zA-Z]*\n/, "")
        .replace(/\n```$/, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        // Try to locate first and last JSON braces as a fallback
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const slice = cleaned.slice(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(slice);
            } catch {}
        }
        return {};
    }
};