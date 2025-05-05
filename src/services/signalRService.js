// src/services/signalRService.js
import * as signalR from '@microsoft/signalr';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';

const HUB_URL = 'http://localhost:5000/chatHub'; // Update with your ASP.NET Core server URL

// Create a context for SignalR
const SignalRContext = createContext(null);

export const SignalRProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize connection
    const startConnection = useCallback(async () => {
        if (connection) {
            return;
        }

        // Create the connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL)
            .withAutomaticReconnect([0, 1000, 5000, null]) // Retry policy
            .configureLogging(signalR.LogLevel.Information)
            .build();

        try {
            // Start the connection
            await newConnection.start();
            setConnection(newConnection);
            setIsConnected(true);
            console.log('SignalR connection established');
            return true;
        } catch (error) {
            console.error('Error establishing SignalR connection:', error);
            throw error;
        }
    }, [connection]);

    // Stop the connection
    const stopConnection = useCallback(async () => {
        if (connection) {
            try {
                await connection.stop();
                setConnection(null);
                setIsConnected(false);
                console.log('SignalR connection stopped');
            } catch (error) {
                console.error('Error stopping SignalR connection:', error);
            }
        }
    }, [connection]);

    // Register for an event
    const on = useCallback((eventName, callback) => {
        if (connection) {
            connection.on(eventName, callback);
        }
    }, [connection]);

    // Remove event handler
    const off = useCallback((eventName, callback) => {
        if (connection) {
            connection.off(eventName, callback);
        }
    }, [connection]);

    // Invoke a hub method
    const invoke = useCallback(async (methodName, ...args) => {
        if (connection) {
            try {
                return await connection.invoke(methodName, ...args);
            } catch (error) {
                console.error(`Error invoking ${methodName}:`, error);
                throw error;
            }
        }
    }, [connection]);

    // Join the chat
    const joinChat = useCallback(async (username) => {
        return invoke('JoinChat', username);
    }, [invoke]);

    // Send a message
    const sendMessage = useCallback(async (username, message) => {
        return invoke('SendMessage', username, message);
    }, [invoke]);

    // Clean up connection on unmount
    useEffect(() => {
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [connection]);

    const value = {
        connection,
        isConnected,
        startConnection,
        stopConnection,
        on,
        off,
        invoke,
        joinChat,
        sendMessage
    };

    return (
        <SignalRContext.Provider value={value}>
            {children}
        </SignalRContext.Provider>
    );
};

// Custom hook to use SignalR
export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
};

// For backward compatibility with the old singleton approach
const startConnection = async () => {
    const { startConnection: start } = useSignalR();
    return start();
};

const stopConnection = async () => {
    const { stopConnection: stop } = useSignalR();
    return stop();
};

const on = (eventName, callback) => {
    const { on: registerEvent } = useSignalR();
    registerEvent(eventName, callback);
};

const off = (eventName, callback) => {
    const { off: unregisterEvent } = useSignalR();
    unregisterEvent(eventName, callback);
};

const invoke = async (methodName, ...args) => {
    const { invoke: invokeMethod } = useSignalR();
    return invokeMethod(methodName, ...args);
};

const joinChat = async (username) => {
    const { joinChat: join } = useSignalR();
    return join(username);
};

const sendMessage = async (username, message) => {
    const { sendMessage: send } = useSignalR();
    return send(username, message);
};

// Export individual functions for direct imports
export { startConnection, stopConnection, on, off, invoke, joinChat, sendMessage };

// Export a backward-compatible object for legacy code
const signalRService = {
    startConnection,
    stopConnection,
    on,
    off,
    invoke,
    joinChat,
    sendMessage
};

export default signalRService;