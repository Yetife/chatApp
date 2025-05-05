// This is a simulated SignalR connection
// In a real app, you would use the @microsoft/signalr package
export const simulateSignalR = () => {
    let listeners = {};
    let messageId = 0;

    // Sample user data (in a real app, this would come from your backend)
    const users = [
        { id: 1, name: "Alex", avatar: "A" },
        { id: 2, name: "Jamie", avatar: "J" },
        { id: 3, name: "Taylor", avatar: "T" },
        { id: 4, name: "You", avatar: "Y" }
    ];

    // Sample initial messages
    const initialMessages = [
        { id: ++messageId, text: "Hey everyone! Welcome to our new chat app.", user: users[0], timestamp: new Date(Date.now() - 3600000) },
        { id: ++messageId, text: "Thanks Alex! The real-time updates are working great.", user: users[1], timestamp: new Date(Date.now() - 1800000) },
        { id: ++messageId, text: "I'm excited to use SignalR with React!", user: users[2], timestamp: new Date(Date.now() - 900000) }
    ];

    return {
        // Method to start the connection to the hub
        start: () => {
            console.log("SignalR connection started (simulated)");
            return Promise.resolve();
        },

        // Method to register event handlers
        on: (event, callback) => {
            listeners[event] = callback;
        },

        // Method to invoke a hub method
        invoke: (method, ...args) => {
            console.log(`Hub method ${method} invoked with:`, args);

            if (method === 'SendMessage') {
                const [message] = args;
                const newMessage = {
                    id: ++messageId,
                    text: message,
                    user: users[3],
                    timestamp: new Date()
                };

                // Simulate network delay
                setTimeout(() => {
                    if (listeners['ReceiveMessage']) {
                        listeners['ReceiveMessage'](newMessage);
                    }

                    // Simulate another user responding after a delay
                    if (Math.random() > 0.5) {
                        setTimeout(() => {
                            const randomUser = users[Math.floor(Math.random() * 3)];
                            const responses = [
                                "That's interesting!",
                                "I agree with that.",
                                "Could you explain more?",
                                "Thanks for sharing that.",
                                "I have a different perspective on this.",
                                "Great point!"
                            ];

                            const responseMsg = {
                                id: ++messageId,
                                text: responses[Math.floor(Math.random() * responses.length)],
                                user: randomUser,
                                timestamp: new Date()
                            };

                            if (listeners['ReceiveMessage']) {
                                listeners['ReceiveMessage'](responseMsg);
                            }
                        }, 2000 + Math.random() * 5000);
                    }
                }, 300);
            }

            return Promise.resolve();
        },

        // Get initial messages (this would normally come from an API call)
        getInitialMessages: () => {
            return Promise.resolve([...initialMessages]);
        }
    };
};