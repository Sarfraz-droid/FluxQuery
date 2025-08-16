export const formatTopic = (topic: string, ...args: string[]) => {
    return topic.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = parseInt(index);
        return args[argIndex] || match;
    });
}