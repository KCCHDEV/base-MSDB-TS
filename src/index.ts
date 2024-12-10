import initializeDatabase from './msdb';

// Initialize the database with debug mode
const myDatabase = initializeDatabase('myDatabase');
const myTable = myDatabase('myTable');

console.log('Starting database operations...');

// Save a batch of entries
const entries = [
  { id: 'entry1', data: { name: 'John Doe', age: 30 } },
  { id: 'entry2', data: { name: 'Jane Doe', age: 25 } },
  { id: 'entry3', data: { name: 'Bob Smith', age: 45 } }
];

entries.forEach(({ id, data }) => {
  myTable.save(id, data);
});

// Retrieve an entry by ID
const retrievedEntry = myTable.find('entry1');
console.log('Retrieved Entry:', retrievedEntry);

// Update an existing entry
myTable.save('entry1', { name: 'John Doe', age: 31 });

// Retrieve all entries with pagination
const allEntries = myTable.getAll('asc');
console.log('All Entries:', allEntries);

// Find entries with specific conditions
const filteredEntries = myTable.getWhere({ age: 31 });
console.log('Filtered Entries:', filteredEntries);

// Remove an entry
myTable.remove('entry1');

console.log('Database operations completed.'); 