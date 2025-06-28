"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msdb_1 = __importDefault(require("./msdb"));
// Test configuration
const TEST_CONFIG = {
    totalEntries: 10000, // Reduced for better stability
    batchSize: 50, // Smaller batch size
    sampleSize: 100, // Reduced sample size
    progressInterval: 2000, // More frequent progress updates
    retryDelay: 500, // Shorter retry delay
    maxRetries: 5, // Increased retries
    cooldownPeriod: 100 // Add cooldown between batches
};
async function runTest() {
    console.log('\n🚀 Initializing database test...');
    const db = (0, msdb_1.default)('performanceTest');
    const testTable = db('largeDataSet');
    // Configure for performance
    testTable.config.setCacheSizeMB(500);
    testTable.config.setTableConfig({
        enableCache: true,
        maxCacheSize: 5000,
        enableIndices: true
    });
    const metrics = {
        totalTime: 0,
        averageSpeed: 0,
        peakMemoryUsage: 0,
        totalSaved: 0,
        batchesProcessed: 0
    };
    console.log(`
📊 Test Configuration:
- Total Entries: ${TEST_CONFIG.totalEntries.toLocaleString()}
- Batch Size: ${TEST_CONFIG.batchSize.toLocaleString()}
- Sample Size: ${TEST_CONFIG.sampleSize.toLocaleString()}
    `);
    // Add cleanup handler
    process.on('exit', () => {
        console.log('\nCleaning up...');
    });
    // Insertion test
    async function runInsertionTest() {
        console.time('⏱️ Total Insertion');
        const startTime = Date.now();
        let lastProgressUpdate = startTime;
        let completedBatches = 0;
        for (let i = 0; i < TEST_CONFIG.totalEntries; i += TEST_CONFIG.batchSize) {
            const batchPromises = [];
            const batchEnd = Math.min(i + TEST_CONFIG.batchSize, TEST_CONFIG.totalEntries);
            for (let j = i; j < batchEnd; j++) {
                const savePromise = retry(() => testTable.save(`test_${j}`, {
                    name: `Test User ${j}`,
                    age: Math.floor(Math.random() * 80) + 18,
                    email: `user${j}@test.com`,
                    tags: [`tag${j % 10}`, `group${j % 5}`],
                    active: Math.random() > 0.5,
                    createdAt: new Date().toISOString()
                }), TEST_CONFIG.maxRetries, TEST_CONFIG.retryDelay);
                batchPromises.push(savePromise);
            }
            await processBatchWithCooldown(batchPromises);
            completedBatches++;
            metrics.totalSaved += batchPromises.length;
            // Show progress
            const now = Date.now();
            if (now - lastProgressUpdate >= TEST_CONFIG.progressInterval) {
                const progress = (metrics.totalSaved / TEST_CONFIG.totalEntries) * 100;
                const speed = metrics.totalSaved / ((now - startTime) / 1000);
                const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log(`Progress: ${progress.toFixed(1)}% | ` +
                    `Speed: ${speed.toFixed(0)} ops/sec | ` +
                    `Memory: ${memUsage.toFixed(1)}MB | ` +
                    `Batches: ${completedBatches}`);
                lastProgressUpdate = now;
            }
        }
        metrics.totalTime = Date.now() - startTime;
        metrics.averageSpeed = metrics.totalSaved / (metrics.totalTime / 1000);
        console.timeEnd('⏱️ Total Insertion');
    }
    // Query test
    async function runQueryTests() {
        console.log('\n🔍 Running query tests...');
        console.time('Random Access');
        const randomPromises = Array(TEST_CONFIG.sampleSize)
            .fill(null)
            .map(() => testTable.random());
        await Promise.all(randomPromises);
        console.timeEnd('Random Access');
        console.time('Condition Query');
        const activeUsers = await testTable.getWhere({ active: true });
        console.log(`Found ${activeUsers.length} active users`);
        console.timeEnd('Condition Query');
        console.time('Sort Test');
        const sortedEntries = await testTable.getAll({ orderBy: 'id', order: 'asc' });
        console.log(`Sorted ${sortedEntries.length} entries`);
        console.timeEnd('Sort Test');
    }
    try {
        // Reduce batch size for better file handling
        TEST_CONFIG.batchSize = 250;
        await runInsertionTest();
        await runQueryTests();
        // Allow time for file operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('\n✅ Performance tests completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}
// Add retry helper
async function retry(fn, maxRetries, delay) {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
// Add batch processing with cooldown
async function processBatchWithCooldown(batch) {
    try {
        await Promise.all(batch);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.cooldownPeriod));
    }
    catch (error) {
        console.error('Batch processing error:', error);
        throw error;
    }
}
// Run the test
runTest().catch(console.error);
