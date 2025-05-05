import { useState, useEffect, useRef } from 'react';
import { Send, User, Clock } from 'lucide-react';
import {simulateSignalR} from "./simulateSignalR.js";

const ChatApp = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const connection = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Initialize SignalR connection
        connection.current = simulateSignalR();

        // Start the connection
        connection.current.start()
            .then(() => {
                setIsConnected(true);

                // Load initial messages
                return connection.current.getInitialMessages();
            })
            .then((initialMessages) => {
                setMessages(initialMessages);
                setIsLoading(false);

                // Set up listener for incoming messages
                connection.current.on('ReceiveMessage', (message) => {
                    setMessages((prevMessages) => [...prevMessages, message]);
                });
            })
            .catch((err) => {
                console.error('Error starting SignalR connection:', err);
                setIsLoading(false);
            });

        // Cleanup function
        return () => {
            // In a real app, you would stop the connection here
            console.log("Cleaning up SignalR connection");
        };
    }, []);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send a message
    const sendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !isConnected) return;

        connection.current.invoke('SendMessage', newMessage)
            .then(() => {
                setNewMessage('');
            })
            .catch((err) => {
                console.error('Error sending message:', err);
            });
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-indigo-600 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">SignalR Chat</h1>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`}></div>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-pulse text-gray-500">Loading messages...</div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.user.name === 'You' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-md rounded-lg p-3 ${
                                    message.user.name === 'You'
                                        ? 'bg-indigo-500 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none shadow'
                                }`}
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        message.user.name === 'You' ? 'bg-indigo-400' : 'bg-gray-200'
                                    }`}>
                                        <span>{message.user.avatar}</span>
                                    </div>
                                    <span className="font-medium">{message.user.name}</span>
                                    <span className="text-xs flex items-center opacity-75">
                    <Clock size={12} className="mr-1" />
                                        {formatTime(message.timestamp)}
                  </span>
                                </div>
                                <p>{message.text}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <div className="container mx-auto flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!isConnected}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newMessage.trim() && isConnected) {
                                    sendMessage(e);
                                }
                            }
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center disabled:bg-gray-400"
                        disabled={!newMessage.trim() || !isConnected}
                    >
                        <Send size={18} className="mr-1" />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;