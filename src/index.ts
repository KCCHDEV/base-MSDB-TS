import initializeDatabase from './msdb';

// Define data types for type safety
interface User {
    name: string;
    age: number;
    email?: string;
    createdAt: Date;
}

// Initialize database with types
const db = initializeDatabase('exampleDB');
const users = db<User>('users');

// Enable debug logging
users.config.toggleDebug(true);

console.log('🚀 Starting database operations...');

// Example batch operations
const usersData: User[] = [
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

// Save users with auto-generated IDs
usersData.forEach(userData => {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    users.save(id, userData);
});

// Demonstrate queries
console.log('\n📊 Database Query Examples:');

// Find users by age
const age25Users = users.getWhere({ age: 25 });
console.log('\n👥 Users aged 25:', age25Users);

// Get all users sorted
const allUsers = users.getAll('asc');
console.log('\n📋 All users (sorted):', allUsers);

// Get a random user
const randomUser = users.random();
console.log('\n🎲 Random user:', randomUser);

console.log('\n✅ Database operations completed.');