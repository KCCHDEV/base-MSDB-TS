"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msdb_1 = __importDefault(require("./msdb"));
// Initialize database with types
const db = (0, msdb_1.default)('exampleDB');
const users = db('users');
// Enable debug logging
users.config.toggleDebug(true);
console.log('🚀 Starting database operations...');
// Example batch operations
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
