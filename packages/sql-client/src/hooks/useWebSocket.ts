import React, { useEffect } from 'react'
import { useAppStore } from '../store'
import { WEBSOCKET_EVENTS } from 'shared';

export const useWebSocket = () => {
    useEffect(() => {
        window.addEventListener(WEBSOCKET_EVENTS.OPEN, () => {
            console.log("WebSocket opened");
        });

        return () => {
            window.removeEventListener(WEBSOCKET_EVENTS.OPEN, () => {
                console.log("WebSocket opened");
            });
        };
    }, []);

    useEffect(() => {
        window.addEventListener(WEBSOCKET_EVENTS.MESSAGE, (event) => {
            console.log("WebSocket message");
        });

        return () => {
            window.removeEventListener(WEBSOCKET_EVENTS.MESSAGE, (event) => {
                console.log("WebSocket message");
            });
        };
    }, []);

    useEffect(() => {
        window.addEventListener(WEBSOCKET_EVENTS.CLOSE, () => {
            console.log("WebSocket closed");
        });

        return () => {
            window.removeEventListener(WEBSOCKET_EVENTS.CLOSE, () => {
                console.log("WebSocket closed");
            });
        };
    }, []);

    useEffect(() => {
        window.addEventListener(WEBSOCKET_EVENTS.ERROR, () => {
            console.log("WebSocket error");
        });

        return () => {
            window.removeEventListener(WEBSOCKET_EVENTS.ERROR, () => {
                console.log("WebSocket error");
            });
        };
    }, []);
}
