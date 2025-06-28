"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msdb_1 = __importDefault(require("./msdb"));
// Initialize database with types
const db = (0, msdb_1.default)('example');
const users = db('users');
// Enable debug logging
users.config.toggleDebug(true);
// Improve error handling wrapper
async function safeOperation(operation, errorMessage) {
    try {
        return await operation();
    }
    catch (error) {
        console.error(`${errorMessage}:`, error);
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Example batch operations with error handling
const usersData = [
    {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        createdAt: new Date()
    },
    {
        name: 'Jane Smith',
        age: 25,
        createdAt: new Date()
    }
];
// Add transaction-like batch operation
async function batchOperation(operations) {
    const results = [];
    for (const op of operations) {
        try {
            await op();
            results.push(true);
        }
        catch (error) {
            results.push(false);
            console.error('Operation failed:', error);
        }
    }
    return results;
}
// Wrap the main execution in an async function
async function main() {
    try {
        console.log('🚀 Starting database operations...');
        // Save users with better error handling
        for (const userData of usersData) {
            await safeOperation(async () => {
                const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await users.save(id, userData);
                return id;
            }, 'Failed to save user');
        }
        // Example usage of batch operation
        await batchOperation([
            async () => users.save('user1', { name: 'User 1', age: 20, createdAt: new Date() }),
            async () => users.save('user2', { name: 'User 2', age: 30, createdAt: new Date() })
        ]);
        // Ensure all operations are properly awaited
        const queryResults = await Promise.all([
            users.getWhere({ age: 25 }),
            users.getAll({ orderBy: 'id', order: 'asc' }),
            users.random()
        ]);
        console.log('\n📊 Query Results:');
        console.log('Age 25:', queryResults[0]);
        console.log('All Users:', queryResults[1]);
        console.log('Random User:', queryResults[2]);
        await users.save('user1', {
            name: 'John Doe',
            age: 30,
            email: 'john@example.com',
            createdAt: new Date()
        });
        const user = await users.find('user1');
        console.log('Found user:', user);
        const allUsers = await users.getAll();
        console.log('All users:', allUsers);
    }
    catch (error) {
        console.error('❌ Application error:', error);
        process.exit(1);
    }
}
// Run the main function and handle any errors
main().catch(error => {
    console.error('❌ Application error:', error);
    process.exit(1);
});
