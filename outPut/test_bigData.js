"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msdb_1 = __importDefault(require("./msdb"));
// Initialize database
const db = (0, msdb_1.default)('performanceTest');
const testTable = db('largeDataSet');
// Test configuration
const TEST_CONFIG = {
    totalEntries: 1000000,
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
function runInsertionTest() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
// Query performance test
function runQueryTests() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
// Run tests
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield runInsertionTest();
    yield runQueryTests();
    console.log('\n✅ Performance tests completed');
    process.exit(0);
}))();
