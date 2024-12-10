import initializeDatabase from './msdb';

const myDatabase = initializeDatabase('largeTestDatabase');
const myTable = myDatabase('largeTestTable');

const numberOfEntries = 100000;
const batchSize = 1000; // Match the cache limit

console.log(`Starting to insert ${numberOfEntries} entries in batches of ${batchSize}...`);
console.time('Total Insertion Time');

// Insert entries in batches
for (let batch = 0; batch < Math.ceil(numberOfEntries / batchSize); batch++) {
  console.time(`Batch ${batch + 1}`);
  
  const startIdx = batch * batchSize;
  const endIdx = Math.min((batch + 1) * batchSize, numberOfEntries);
  
  for (let i = startIdx; i < endIdx; i++) {
    const entryId = `entry${i}`;
    myTable.save(entryId, {
      name: `User ${i}`,
      age: Math.floor(Math.random() * 100),
      email: `user${i}@example.com`,
      createdAt: new Date().toISOString()
    });
  }
  
  console.timeEnd(`Batch ${batch + 1}`);
  console.log(`Processed entries ${startIdx} to ${endIdx - 1}`);
}

console.timeEnd('Total Insertion Time');

// Verify data by sampling
console.log('\nVerifying data with samples:');
console.time('Sample Retrieval');

// Get first 5 entries
const firstEntries = myTable.getAll('asc').slice(0, 5);
console.log('First 5 entries:', firstEntries);

// Get some random entries
const randomEntries = Array(5).fill(null).map(() => myTable.random());
console.log('5 Random entries:', randomEntries);

// Test querying
const youngUsers = myTable.getWhere({ age: 25 });
console.log(`Found ${youngUsers.length} users aged 25`);

console.timeEnd('Sample Retrieval');