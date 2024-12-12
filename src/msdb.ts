import fs from 'fs';
import path from 'path';

const PART_SIZE = 5000; // Number of entries per file part
const DEBUG = true; // Set to true to enable debug logging
const CACHE_LIMIT = 1000; // Cache limit before flushing to disk
const CACHE_CHECK_INTERVAL = 30000; // 30 seconds

function logDebug(message: string) {
    if (DEBUG) {
        fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
    }
}

function initializeDatabase(databaseName: string) {
    const databaseFolderPath = './Database[LOCAL]';

    if (!fs.existsSync(databaseFolderPath)) {
        fs.mkdirSync(databaseFolderPath, { recursive: true });
        console.log(`Created directory: ${databaseFolderPath}`);
    }

    const fullDatabaseFolderPath = path.join(databaseFolderPath, databaseName);
    if (!fs.existsSync(fullDatabaseFolderPath)) {
        fs.mkdirSync(fullDatabaseFolderPath, { recursive: true });
        console.log(`Created directory: ${fullDatabaseFolderPath}`);
    }

    return function initializeTable(tableName: string) {
        const tableFolderPath = path.join(fullDatabaseFolderPath, tableName);
        if (!fs.existsSync(tableFolderPath)) {
            fs.mkdirSync(tableFolderPath, { recursive: true });
        }

        let tableData: Record<string, any> = loadTableData();
        let cache = new Map<string, any>();

        function loadTableData() {
            const files = fs.readdirSync(tableFolderPath).filter((file) => file.endsWith('.json'));
            const data: Record<string, any> = {};

            for (const file of files) {
                const filePath = path.join(tableFolderPath, file);
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                Object.assign(data, fileData);
            }

            logDebug(`Loaded table data for ${tableName}`);
            return data;
        }

        async function saveTableData() {
            const entries = Object.entries(tableData);
            for (let i = 0; i < entries.length; i += PART_SIZE) {
                const chunk = Object.fromEntries(entries.slice(i, i + PART_SIZE));
                const filePath = path.join(tableFolderPath, `part_${Math.floor(i / PART_SIZE)}.json`);
                if (fs.existsSync(filePath)) {
                    console.log(`Overwriting existing file: ${filePath}`);
                }
                await fs.promises.writeFile(filePath, JSON.stringify(chunk, null, 2), 'utf8');
                console.log(`Saved data to file: ${filePath}`);
            }

            const existingFiles = fs.readdirSync(tableFolderPath).filter((file) => file.startsWith('part_'));
            const requiredFileCount = Math.ceil(entries.length / PART_SIZE);
            for (const file of existingFiles.slice(requiredFileCount)) {
                fs.unlinkSync(path.join(tableFolderPath, file));
            }

            logDebug(`Saved table data for ${tableName}`);
        }

        function saveEntry(id: string, data: any) {
            try {
                const entryId = id || generateUniqueId();
                tableData[entryId] = { id: entryId, value: data };
                cache.set(entryId, tableData[entryId]);
                logDebug(`Added entry ${entryId} to cache`);

                if (cache.size >= CACHE_LIMIT) {
                    saveTableData();
                    cache.clear();
                    logDebug(`Cache flushed for ${tableName}`);
                }
            } catch (error) {
                console.error('Error saving entry:', error);
                throw error;
            }
        }

        setInterval(() => {
            if (cache.size > 0) {
                logDebug(`Cache contents for ${tableName}: ${JSON.stringify(Array.from(cache.entries()), null, 2)}`);
            }
        }, CACHE_CHECK_INTERVAL);

        function removeEntry(id: string) {
            if (tableData[id]) {
                delete tableData[id];
                saveTableData();
                logDebug(`Removed entry ${id} from ${tableName}`);
            }
        }

        function getEntry(id: string) {
            if (cache.has(id)) {
                logDebug(`Retrieved entry ${id} from cache`);
                return cache.get(id);
            }
            const entry = tableData[id] || null;
            logDebug(`Retrieved entry ${id} from ${tableName}`);
            return entry;
        }

        function getAllEntries(orderBy = 'asc') {
            const entries = [...cache.values(), ...Object.values(tableData)];
            const result = entries.sort((a, b) => (orderBy === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
            logDebug(`Retrieved all entries from ${tableName} ordered by ${orderBy}`);
            return result;
        }

        function getWhere(condition: { [key: string]: any }) {
            const result = [...cache.values(), ...Object.values(tableData)].filter((entry) => {
                for (const key in condition) {
                    if (entry.value[key] !== condition[key]) return false;
                }
                return true;
            });
            logDebug(`Retrieved entries from ${tableName} with condition ${JSON.stringify(condition)}`);
            return result;
        }

        function getRandomEntry() {
            const allEntries = [...cache.keys(), ...Object.keys(tableData)];
            if (allEntries.length === 0) return null;
            const randomKey = allEntries[Math.floor(Math.random() * allEntries.length)];
            const entry = cache.get(randomKey) || tableData[randomKey];
            logDebug(`Retrieved random entry from ${tableName}`);
            return entry;
        }

        function saveCacheOnExit() {
            if (cache.size > 0) {
                console.log('Saving cache to disk on exit...');
                saveTableData();
                cache.clear();
            }
        }

        process.on('exit', saveCacheOnExit);
        process.on('SIGINT', () => {
            saveCacheOnExit();
            process.exit();
        });

        return {
            find: getEntry,
            save: saveEntry,
            remove: removeEntry,
            random: getRandomEntry,
            getAll: getAllEntries,
            getWhere: getWhere,
        };
    };
}

function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default initializeDatabase;