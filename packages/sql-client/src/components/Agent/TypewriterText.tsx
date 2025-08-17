import { useEffect, useMemo, useRef, useState } from 'react'

type TypewriterTextProps = {
    text: string;
    speedMsPerChar?: number; // smaller is faster
    startDelayMs?: number;
    className?: string;
}

export function TypewriterText({
    text,
    speedMsPerChar = 18,
    startDelayMs = 0,
    className,
}: TypewriterTextProps) {
    const [visibleText, setVisibleText] = useState<string>('');
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // Create a stable key so we fully re-run the typewriter whenever text changes
    const typingKey = useMemo(() => text, [text]);

    useEffect(() => {
        // reset for new text
        setVisibleText('');

        // clear any previous timers
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (!typingKey || typingKey.length === 0) {
            return;
        }

        let index = 0;
        const startTyping = () => {
            intervalRef.current = window.setInterval(() => {
                index += 1;
                setVisibleText(typingKey.slice(0, index));
                if (index >= typingKey.length) {
                    if (intervalRef.current) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            }, Math.max(1, speedMsPerChar));
        };

        if (startDelayMs > 0) {
            timeoutRef.current = window.setTimeout(startTyping, startDelayMs);
        } else {
            startTyping();
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
        // re-run only when the actual text changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typingKey, speedMsPerChar, startDelayMs]);

    return <span className={className}>{visibleText}</span>;
}


