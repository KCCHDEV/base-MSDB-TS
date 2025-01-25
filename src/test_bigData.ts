import initializeDatabase from './msdb';

// Define test data structure
interface TestData {
    name: string;
    age: number;
    email: string;
    tags: string[];
    active: boolean;
    createdAt: string;
}

// Initialize database
const db = initializeDatabase('performanceTest');
const testTable = db<TestData>('largeDataSet');

// Test configuration
const TEST_CONFIG = {
    totalEntries: 1_000_000,
    batchSize: 2500,
    sampleSize: 1000
};

console.log(`
🔍 Performance Test Configuration:
- Total Entries: ${TEST_CONFIG.totalEntries.toLocaleString()}
- Batch Size: ${TEST_CONFIG.batchSize.toLocaleString()}
- Sample Size: ${TEST_CONFIG.sampleSize.toLocaleString()}
`);

// Insertion test
async function runInsertionTest() {
    console.time('⏱️ Total Insertion');
    
    for (let batch = 0; Math.ceil(TEST_CONFIG.totalEntries / TEST_CONFIG.batchSize); batch++) {
        const batchStart = Date.now();
        const startIdx = batch * TEST_CONFIG.batchSize;
        const endIdx = Math.min((batch + 1) * TEST_CONFIG.batchSize, TEST_CONFIG.totalEntries);
        
        for (let i = startIdx; i < endIdx; i++) {
            testTable.save(`test_${i}`, {
                name: `Test User ${i}`,
                age: Math.floor(Math.random() * 80) + 18,
                email: `user${i}@test.com`,
                tags: [`tag${i % 10}`, `group${i % 5}`],
                active: Math.random() > 0.5,
                createdAt: new Date().toISOString()
            });
        }
        
        const batchTime = Date.now() - batchStart;
        console.log(`Batch ${batch + 1}: ${endIdx - startIdx} entries in ${batchTime}ms (${Math.round((endIdx - startIdx) / (batchTime / 1000))} ops/sec)`);
    }
    
    console.timeEnd('⏱️ Total Insertion');
}

// Query performance test
async function runQueryTests() {
    console.log('\n🔍 Running query tests...');
    
    // Test random access
    console.time('Random Access (1000 entries)');
    const randomResults = Array(1000).fill(null).map(() => testTable.random());
    console.timeEnd('Random Access (1000 entries)');
    
    // Test condition query
    console.time('Condition Query');
    const activeUsers = testTable.getWhere({ active: true });
    console.log(`Found ${activeUsers.length} active users`);
    console.timeEnd('Condition Query');
    
    // Test sorting
    console.time('Sort All Entries');
    const sortedEntries = testTable.getAll('asc');
    console.log(`Sorted ${sortedEntries.length} entries`);
    console.timeEnd('Sort All Entries');
}

// Run tests
(async () => {
    await runInsertionTest();
    await runQueryTests();
    console.log('\n✅ Performance tests completed');
    process.exit(0);
})();