// src/services/mockSignalRService.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const MockSignalRContext = createContext(null);

export const MockSignalRProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [eventHandlers, setEventHandlers] = useState({});
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);

    // Initialize connection
    const startConnection = useCallback(async () => {
        console.log('Starting mock SignalR connection...');

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsConnected(true);
        console.log('Mock SignalR connection established');
        return true;
    }, []);

    // Stop the connection
    const stopConnection = useCallback(async () => {
        if (isConnected) {
            // Simulate disconnection delay
            await new Promise(resolve => setTimeout(resolve, 500));

            setIsConnected(false);
            console.log('Mock SignalR connection stopped');
        }
    }, [isConnected]);

    // Register for an event
    const on = useCallback((eventName, callback) => {
        console.log(`Registered handler for event: ${eventName}`);
        setEventHandlers(prev => ({
            ...prev,
            [eventName]: [...(prev[eventName] || []), callback]
        }));
    }, []);

    // Remove event handler
    const off = useCallback((eventName, callback) => {
        console.log(`Removed handler for event: ${eventName}`);
        setEventHandlers(prev => ({
            ...prev,
            [eventName]: prev[eventName]?.filter(cb => cb !== callback) || []
        }));
    }, []);

    // Simulate triggering an event
    const triggerEvent = useCallback((eventName, ...args) => {
        console.log(`Triggering event: ${eventName}`, args);
        eventHandlers[eventName]?.forEach(callback => {
            callback(...args);
        });
    }, [eventHandlers]);

    // Invoke a hub method
    const invoke = useCallback(async (methodName, ...args) => {
        if (!isConnected) {
            console.error('Cannot invoke method: Not connected');
            throw new Error('Not connected');
        }

        console.log(`Mock invoke: ${methodName}`, args);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Simulate responses based on method
        switch (methodName) {
            case 'JoinChat': {
                const [username] = args;
                const newUser = { id: Date.now().toString(), name: username };

                setUsers(prev => [...prev, newUser]);

                // Notify others that user joined
                setTimeout(() => {
                    triggerEvent('UserJoined', username);

                    // Send welcome message
                    triggerEvent('ReceiveMessage', 'System', `Welcome, ${username}! There are ${users.length + 1} users online.`);
                }, 500);

                return { success: true, userId: newUser.id };
            }

            case 'SendMessage': {
                const [username, message] = args;
                const newMessage = {
                    id: Date.now().toString(),
                    username,
                    content: message,
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, newMessage]);

                // Broadcast to all "clients"
                setTimeout(() => {
                    triggerEvent('ReceiveMessage', username, message, newMessage.timestamp);
                }, 500);

                return { success: true, messageId: newMessage.id };
            }

            default:
                console.warn(`Unhandled method call: ${methodName}`);
                return null;
        }
    }, [isConnected, triggerEvent, users.length]);

    // Join the chat
    const joinChat = useCallback(async (username) => {
        return invoke('JoinChat', username);
    }, [invoke]);

    // Send a message
    const sendMessage = useCallback(async (username, message) => {
        return invoke('SendMessage', username, message);
    }, [invoke]);

    // Simulate random events for testing
    useEffect(() => {
        if (isConnected && users.length > 0) {
            // Simulate occasional system messages
            const systemMessageInterval = setInterval(() => {
                const randomEvents = [
                    'Server will be restarting in 30 minutes for maintenance.',
                    `There are currently ${users.length} users online.`,
                    'New features have been added to the chat!',
                    'Remember to be kind to each other.'
                ];

                const randomMessage = randomEvents[Math.floor(Math.random() * randomEvents.length)];
                triggerEvent('ReceiveMessage', 'System', randomMessage);
            }, 60000); // Every minute

            return () => clearInterval(systemMessageInterval);
        }
    }, [isConnected, users.length, triggerEvent]);

    // Debug helpers for testing
    const debug = {
        simulateUserJoin: (username) => {
            triggerEvent('UserJoined', username);
        },
        simulateUserLeave: (username) => {
            triggerEvent('UserLeft', username);
        },
        simulateMessage: (username, message) => {
            triggerEvent('ReceiveMessage', username, message, new Date().toISOString());
        },
        simulateDisconnect: () => {
            triggerEvent('Disconnected', 'Server connection lost');
            setIsConnected(false);
        },
        simulateReconnect: () => {
            triggerEvent('Reconnected', 'Server connection restored');
            setIsConnected(true);
        }
    };

    const value = {
        isConnected,
        startConnection,
        stopConnection,
        on,
        off,
        invoke,
        joinChat,
        sendMessage,
        debug // Expose debug helpers
    };

    return (
        <MockSignalRContext.Provider value={value}>
            {children}
        </MockSignalRContext.Provider>
    );
};

// Custom hook to use Mock SignalR
export const useMockSignalR = () => {
    const context = useContext(MockSignalRContext);
    if (!context) {
        throw new Error('useMockSignalR must be used within a MockSignalRProvider');
    }
    return context;
};

// For backward compatibility with the original service
const startConnection = async () => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const stopConnection = async () => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const on = (eventName, callback) => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const off = (eventName, callback) => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const invoke = async (methodName, ...args) => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const joinChat = async (username) => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

const sendMessage = async (username, message) => {
    throw new Error('Mock SignalR service must be used with React hooks. Use the MockSignalRProvider and useMockSignalR hook.');
};

// Export a backward-compatible object for legacy code
const mockSignalRService = {
    startConnection,
    stopConnection,
    on,
    off,
    invoke,
    joinChat,
    sendMessage
};

export default mockSignalRService;