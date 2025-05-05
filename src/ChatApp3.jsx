import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Send, User, MessageSquare, Loader } from 'lucide-react';
import signalRService from '../src/services/signalRService.js';

const ChatApp3 = () => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);

    // Function to initialize SignalR connection
    const startConnection = async () => {
        try {
            setIsJoining(true);
            setError('');

            // Start the connection
            await signalRService.startConnection();

            // Register for receiving messages
            signalRService.on('ReceiveMessage', (message) => {
                setMessages(prevMessages => [...prevMessages, message]);
            });

            // Register for user joined notifications
            signalRService.on('UserJoined', (user) => {
                setUsers(prevUsers => {
                    // Avoid duplicate users
                    if (prevUsers.includes(user)) return prevUsers;
                    return [...prevUsers, user];
                });

                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        id: Date.now().toString(),
                        sender: 'System',
                        content: `${user} has joined the chat.`,
                        timestamp: new Date().toISOString()
                    }
                ]);
            });

            // Register for user left notifications
            signalRService.on('UserLeft', (user) => {
                setUsers(prevUsers => prevUsers.filter(u => u !== user));

                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        id: Date.now().toString(),
                        sender: 'System',
                        content: `${user} has left the chat.`,
                        timestamp: new Date().toISOString()
                    }
                ]);
            });

            // Register for receiving user list
            signalRService.on('ReceiveUserList', (userList) => {
                setUsers(userList);
            });

            // Join the chat room
            await signalRService.joinChat(username);
            setIsConnected(true);

        } catch (err) {
            console.error('Connection failed:', err);
            setError('Failed to connect to the chat. Please try again.');
            setIsConnected(false);
        } finally {
            setIsJoining(false);
        }
    };

    // Clean up SignalR connection on component unmount
    useEffect(() => {
        return () => {
            if (isConnected) {
                signalRService.stopConnection();
            }
        };
    }, [isConnected]);

    // Handle sending message
    const sendMessage = async () => {
        if (!message.trim()) return;

        try {
            await signalRService.sendMessage(username, message);
            setMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please try again.');
        }
    };

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Handle enter key press for sending messages
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {!isConnected ? (
                <div className="flex items-center justify-center h-full">
                    <div className="bg-white p-8 rounded-lg shadow-md w-96">
                        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Join Chat Room</h1>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && username.trim()) {
                                            startConnection();
                                        }
                                    }}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={startConnection}
                                disabled={!username.trim() || isJoining}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center"
                            >
                                {isJoining ? (
                                    <>
                                        <Loader className="animate-spin h-4 w-4 mr-2" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight className="h-4 w-4 mr-2" />
                                        Join Chat
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-64 bg-blue-800 text-white p-4 hidden md:block">
                        <h2 className="text-xl font-bold mb-4">Online Users</h2>
                        <ul className="space-y-2">
                            {users.map((user, index) => (
                                <li key={index} className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className={user === username ? "font-bold" : ""}>
                    {user} {user === username && "(You)"}
                  </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Chat Header */}
                        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                                <h1 className="text-xl font-semibold">Chat Room</h1>
                            </div>
                            <div className="text-sm text-gray-500">
                                Logged in as <span className="font-semibold">{username}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.sender === 'System' ? (
                                            <div className="bg-gray-200 text-gray-700 rounded-md py-2 px-4 max-w-xs md:max-w-md text-sm">
                                                {msg.content}
                                            </div>
                                        ) : (
                                            <div className={`rounded-md py-2 px-4 max-w-xs md:max-w-md ${
                                                msg.sender === username
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                <div className="font-medium text-sm mb-1">
                                                    {msg.sender === username ? 'You' : msg.sender}
                                                </div>
                                                <div>{msg.content}</div>
                                                <div className="text-xs text-right mt-1 opacity-75">
                                                    {formatTime(msg.timestamp)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="border-t p-4 bg-white flex">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type your message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 transition"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatApp3;