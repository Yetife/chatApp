// src/components/ChatComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useMockSignalR } from './services/mockSignalRService.jsx';

const ChatComponent = () => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isJoined, setIsJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const messageEndRef = useRef(null);

    const {
        isConnected,
        startConnection,
        on,
        off,
        joinChat,
        sendMessage,
        debug
    } = useMockSignalR();

    // Handle scrolling to bottom when new messages arrive
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Connect to SignalR when component mounts
    useEffect(() => {
        const setupConnection = async () => {
            setIsConnecting(true);
            try {
                await startConnection();
            } catch (error) {
                console.error('Failed to connect to SignalR hub:', error);
            } finally {
                setIsConnecting(false);
            }
        };

        setupConnection();
    }, [startConnection]);

    // Register for SignalR events
    useEffect(() => {
        if (isConnected) {
            // Handle receiving messages
            const handleReceiveMessage = (user, content, timestamp) => {
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        username: user,
                        content,
                        timestamp: timestamp || new Date().toISOString(),
                        isSystem: user === 'System'
                    }
                ]);
            };

            // Handle user joined notification
            const handleUserJoined = (user) => {
                if (user !== username) {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            username: 'System',
                            content: `${user} has joined the chat`,
                            timestamp: new Date().toISOString(),
                            isSystem: true
                        }
                    ]);
                }
            };

            // Handle user left notification
            const handleUserLeft = (user) => {
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        username: 'System',
                        content: `${user} has left the chat`,
                        timestamp: new Date().toISOString(),
                        isSystem: true
                    }
                ]);
            };

            // Register event handlers
            on('ReceiveMessage', handleReceiveMessage);
            on('UserJoined', handleUserJoined);
            on('UserLeft', handleUserLeft);

            // Clean up event handlers
            return () => {
                off('ReceiveMessage', handleReceiveMessage);
                off('UserJoined', handleUserJoined);
                off('UserLeft', handleUserLeft);
            };
        }
    }, [isConnected, on, off, username]);

    // Handle joining the chat
    const handleJoin = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            alert('Please enter a username');
            return;
        }

        setIsConnecting(true);
        try {
            await joinChat(username);
            setIsJoined(true);
        } catch (error) {
            console.error('Failed to join chat:', error);
            alert('Failed to join chat. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            await sendMessage(username, message);
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // For testing - simulate events
    const handleTestEvent = (event) => {
        switch(event) {
            case 'join':
                debug.simulateUserJoin('TestUser' + Math.floor(Math.random() * 100));
                break;
            case 'leave':
                debug.simulateUserLeave('TestUser' + Math.floor(Math.random() * 100));
                break;
            case 'message':
                debug.simulateMessage(
                    'TestUser' + Math.floor(Math.random() * 100),
                    'This is a test message ' + Math.floor(Math.random() * 1000)
                );
                break;
            case 'disconnect':
                debug.simulateDisconnect();
                break;
            case 'reconnect':
                debug.simulateReconnect();
                break;
            default:
                break;
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-50">
            <h1 className="text-2xl font-bold mb-4 text-center">SignalR Chat Demo</h1>

            {/* Connection status */}
            <div className="mb-4">
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            {!isJoined ? (
                // Join form
                <form onSubmit={handleJoin} className="mb-4 p-4 bg-white rounded shadow">
                    <div className="mb-4">
                        <label htmlFor="username" className="block mb-2 font-medium">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded"
                            disabled={isConnecting}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                        disabled={!isConnected || isConnecting}
                    >
                        {isConnecting ? 'Joining...' : 'Join Chat'}
                    </button>
                </form>
            ) : (
                <>
                    {/* Messages container */}
                    <div className="flex-1 bg-white rounded shadow mb-4 overflow-auto">
                        <div className="p-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 p-4">No messages yet</div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`mb-3 p-2 rounded ${
                                            msg.isSystem
                                                ? 'bg-gray-100 text-gray-700'
                                                : msg.username === username
                                                    ? 'bg-blue-100 ml-auto max-w-[80%]'
                                                    : 'bg-gray-200 max-w-[80%]'
                                        }`}
                                    >
                                        {!msg.isSystem && (
                                            <div className="font-bold">{msg.username}</div>
                                        )}
                                        <div>{msg.content}</div>
                                        <div className="text-xs text-gray-500 text-right">
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messageEndRef} />
                        </div>
                    </div>

                    {/* Message form */}
                    <form onSubmit={handleSendMessage} className="flex">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 p-2 border rounded-l"
                            placeholder="Type a message..."
                            disabled={!isConnected}
                        />
                        <button
                            type="submit"
                            className="p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-blue-300"
                            disabled={!isConnected || !message.trim()}
                        >
                            Send
                        </button>
                    </form>

                    {/* Debug controls */}
                    <div className="mt-4 p-2 border-t">
                        <p className="text-sm text-gray-500 mb-2">Test controls:</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleTestEvent('join')}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Simulate Join
                            </button>
                            <button
                                onClick={() => handleTestEvent('leave')}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Simulate Leave
                            </button>
                            <button
                                onClick={() => handleTestEvent('message')}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Simulate Message
                            </button>
                            <button
                                onClick={() => handleTestEvent('disconnect')}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Disconnect
                            </button>
                            <button
                                onClick={() => handleTestEvent('reconnect')}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Reconnect
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatComponent;