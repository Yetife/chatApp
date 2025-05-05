export const mockSignalR = {
    // Our connection status
    connected: false,

    // Mock messages
    messages: [
        { id: 1, sender: 'System', content: 'Welcome to the chat!', timestamp: new Date().toISOString() },
    ],

    // Mock user list
    users: ['User1', 'User2', 'Admin'],

    // Mock connection hub
    connection: {
        start: async function() {
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            mockSignalR.connected = true;
            return Promise.resolve();
        },
        on: function(event, callback) {
            // Register listeners for our mock events
            mockSignalR.listeners[event] = callback;
        },
        invoke: function(method, ...args) {
            // Handle method invocations
            if (method === 'SendMessage') {
                const [sender, content] = args;
                const newMessage = {
                    id: mockSignalR.messages.length + 1,
                    sender,
                    content,
                    timestamp: new Date().toISOString()
                };
                mockSignalR.messages.push(newMessage);

                // Trigger the registered listener after a small delay to simulate network
                setTimeout(() => {
                    if (mockSignalR.listeners['ReceiveMessage']) {
                        mockSignalR.listeners['ReceiveMessage'](newMessage);
                    }
                }, 300);
            }
            else if (method === 'JoinChat') {
                const [username] = args;
                if (!mockSignalR.users.includes(username)) {
                    mockSignalR.users.push(username);
                }

                // Notify about user joined
                setTimeout(() => {
                    if (mockSignalR.listeners['UserJoined']) {
                        mockSignalR.listeners['UserJoined'](username);
                    }
                }, 300);
            }
        }
    },

    // Storage for event listeners
    listeners: {}
};