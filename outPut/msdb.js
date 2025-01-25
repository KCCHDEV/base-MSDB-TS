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
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
// Configuration settings for database behavior
const CONFIG = {
    PART_SIZE: 5000, // Maximum entries per file
    CACHE_LIMIT: 1000, // Maximum entries in memory before writing to disk
    CACHE_CHECK_INTERVAL: 30000, // How often to check cache (in ms)
    LOGGING: {
        ENABLED: true, // Master switch for logging
        DEBUG: true, // Enables detailed debug logs
        FILE_LOGGING: true, // Save logs to file
        CONSOLE_LOGGING: true, // Show logs in console
        LOG_FILE: 'msdb.log' // Log file name
    }
};
// Log message types with emojis for better visibility
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "\uD83D\uDCD8 INFO";
    LogLevel["ERROR"] = "\u274C ERROR";
    LogLevel["DEBUG"] = "\uD83D\uDD0D DEBUG";
    LogLevel["WARN"] = "\u26A0\uFE0F WARN";
})(LogLevel || (LogLevel = {}));
// Main logging function that handles both console and file logging
function log(level, message, ...args) {
    if (!CONFIG.LOGGING.ENABLED)
        return;
    const timestamp = new Date().toISOString();
    const formattedMessage = `[MSDB 💾] ${timestamp} ${level}: ${message}`;
    if (args.length > 0) {
        const data = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
        formattedMessage + ` | Data: ${data}`;
    }
    if (CONFIG.LOGGING.CONSOLE_LOGGING) {
        console.log(formattedMessage);
    }
    if (CONFIG.LOGGING.FILE_LOGGING) {
        node_fs_1.default.appendFileSync(CONFIG.LOGGING.LOG_FILE, formattedMessage + '\n');
    }
}
// Replace the old logDebug function
function logDebug(message, ...args) {
    if (CONFIG.LOGGING.DEBUG) {
        log(LogLevel.DEBUG, message, ...args);
    }
}
/**
 * Initialize a new database instance
 * @param databaseName Name of the database to create/open
 */
function initializeDatabase(databaseName) {
    // Create database directory structure if it doesn't exist
    const databaseFolderPath = './Database[LOCAL]';
    if (!node_fs_1.default.existsSync(databaseFolderPath)) {
        node_fs_1.default.mkdirSync(databaseFolderPath, { recursive: true });
        log(LogLevel.INFO, `Created directory: ${databaseFolderPath}`);
    }
    const fullDatabaseFolderPath = node_path_1.default.join(databaseFolderPath, databaseName);
    if (!node_fs_1.default.existsSync(fullDatabaseFolderPath)) {
        node_fs_1.default.mkdirSync(fullDatabaseFolderPath, { recursive: true });
        log(LogLevel.INFO, `Created directory: ${fullDatabaseFolderPath}`);
    }
    /**
     * Initialize a new table in the database
     * @param tableName Name of the table to create/open
     * @returns Object containing table operation methods
     */
    return function initializeTable(tableName) {
        const tableFolderPath = node_path_1.default.join(fullDatabaseFolderPath, tableName);
        if (!node_fs_1.default.existsSync(tableFolderPath)) {
            node_fs_1.default.mkdirSync(tableFolderPath, { recursive: true });
        }
        // Table data storage - combination of disk and memory cache
        let tableData = loadTableData();
        let cache = new Map();
        /**
         * Load existing table data from disk
         * Combines all part files into single data object
         */
        function loadTableData() {
            const files = node_fs_1.default.readdirSync(tableFolderPath).filter((file) => file.endsWith('.json'));
            const data = {};
            for (const file of files) {
                const filePath = node_path_1.default.join(tableFolderPath, file);
                const fileData = JSON.parse(node_fs_1.default.readFileSync(filePath, 'utf8'));
                Object.assign(data, fileData);
            }
            log(LogLevel.INFO, `Loaded table data for ${tableName}`);
            return data;
        }
        /**
         * Save current table data to disk in parts
         * Splits data into chunks to handle large datasets
         */
        function saveTableData() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const entries = Object.entries(tableData);
                    for (let i = 0; i < entries.length; i += CONFIG.PART_SIZE) {
                        const chunk = Object.fromEntries(entries.slice(i, i + CONFIG.PART_SIZE));
                        const filePath = node_path_1.default.join(tableFolderPath, `part_${Math.floor(i / CONFIG.PART_SIZE)}.json`);
                        yield node_fs_1.default.promises.writeFile(filePath, JSON.stringify(chunk, null, 2), 'utf8');
                        log(LogLevel.INFO, `Saved data chunk to ${filePath}`);
                    }
                }
                catch (error) {
                    log(LogLevel.ERROR, `Failed to save table data: ${error.message}`);
                    throw error;
                }
            });
        }
        /**
         * Save a new entry to the table
         * @param id Optional custom ID, generates random ID if not provided
         * @param data The data to store
         */
        function saveEntry(id, data) {
            try {
                const entryId = id || generateUniqueId();
                const entry = { id: entryId, value: data };
                tableData[entryId] = entry;
                cache.set(entryId, entry);
                logDebug(`Added entry ${entryId} to cache`);
                if (cache.size >= CONFIG.CACHE_LIMIT) {
                    saveTableData();
                    cache.clear();
                    logDebug(`Cache flushed for ${tableName}`);
                }
            }
            catch (error) {
                log(LogLevel.ERROR, 'Error saving entry:', error);
                throw error;
            }
        }
        // Periodic cache inspection for debugging
        setInterval(() => {
            if (cache.size > 0) {
                logDebug(`Cache contents for ${tableName}: ${JSON.stringify(Array.from(cache.entries()), null, 2)}`);
            }
        }, CONFIG.CACHE_CHECK_INTERVAL);
        /**
         * Remove an entry from the table
         * @param id ID of the entry to remove
         */
        function removeEntry(id) {
            if (tableData[id]) {
                delete tableData[id];
                saveTableData();
                logDebug(`Removed entry ${id} from ${tableName}`);
            }
        }
        /**
         * Retrieve an entry by its ID
         * Checks cache first, then disk storage
         */
        function getEntry(id) {
            if (cache.has(id)) {
                logDebug(`Retrieved entry ${id} from cache`);
                return cache.get(id) || null;
            }
            const entry = tableData[id] || null;
            logDebug(`Retrieved entry ${id} from ${tableName}`);
            return entry;
        }
        /**
         * Get all entries with optional sorting
         * @param orderBy Sort direction ('asc' or 'desc')
         */
        function getAllEntries(orderBy = 'asc') {
            const entries = [...cache.values(), ...Object.values(tableData)];
            const result = entries.sort((a, b) => (orderBy === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
            logDebug(`Retrieved all entries from ${tableName} ordered by ${orderBy}`);
            return result;
        }
        /**
         * Find entries matching a condition
         * @param condition Object with key-value pairs to match against
         */
        function getWhere(condition) {
            const result = [...cache.values(), ...Object.values(tableData)].filter((entry) => {
                for (const key in condition) {
                    if (entry.value[key] !== condition[key])
                        return false;
                }
                return true;
            });
            logDebug(`Retrieved entries from ${tableName} with condition ${JSON.stringify(condition)}`);
            return result;
        }
        /**
         * Get a random entry from the table
         */
        function getRandomEntry() {
            const allEntries = [...cache.keys(), ...Object.keys(tableData)];
            if (allEntries.length === 0)
                return null;
            const randomKey = allEntries[Math.floor(Math.random() * allEntries.length)];
            const entry = cache.get(randomKey) || tableData[randomKey];
            logDebug(`Retrieved random entry from ${tableName}`);
            return entry;
        }
        // Data safety: Save cache before program exits
        function saveCacheOnExit() {
            if (cache.size > 0) {
                log(LogLevel.WARN, 'Saving cache to disk before exit...');
                try {
                    const entries = Object.entries(tableData);
                    for (let i = 0; i < entries.length; i += CONFIG.PART_SIZE) {
                        const chunk = Object.fromEntries(entries.slice(i, i + CONFIG.PART_SIZE));
                        const filePath = node_path_1.default.join(tableFolderPath, `part_${Math.floor(i / CONFIG.PART_SIZE)}.json`);
                        node_fs_1.default.writeFileSync(filePath, JSON.stringify(chunk, null, 2), 'utf8');
                    }
                    cache.clear();
                    log(LogLevel.INFO, 'Cache saved successfully');
                }
                catch (error) {
                    log(LogLevel.ERROR, 'Error saving cache during exit:', error);
                    process.exit(1);
                }
            }
        }
        // Clean shutdown handler
        function cleanupAndExit(exitCode = 0) {
            log(LogLevel.INFO, 'Application shutting down...');
            saveCacheOnExit();
            process.exit(exitCode);
        }
        // Register process event handlers for safe shutdown
        process.on('exit', saveCacheOnExit);
        process.on('SIGINT', () => cleanupAndExit());
        process.on('SIGTERM', () => cleanupAndExit());
        process.on('SIGHUP', () => cleanupAndExit());
        process.on('uncaughtException', (error) => {
            log(LogLevel.ERROR, 'Uncaught Exception:', error);
            cleanupAndExit(1);
        });
        // Return public table methods
        return {
            find: getEntry, // Find entry by ID
            save: saveEntry, // Save new entry
            remove: removeEntry, // Remove entry by ID
            random: getRandomEntry, // Get random entry
            getAll: getAllEntries, // Get all entries
            getWhere: getWhere, // Find entries by condition
            config: {
                // Runtime configuration methods
                toggleLogging: (enabled) => {
                    CONFIG.LOGGING.ENABLED = enabled;
                    log(LogLevel.INFO, `Logging ${enabled ? 'enabled' : 'disabled'}`);
                },
                toggleDebug: (enabled) => {
                    CONFIG.LOGGING.DEBUG = enabled;
                    log(LogLevel.INFO, `Debug logging ${enabled ? 'enabled' : 'disabled'}`);
                },
                setLogFile: (filename) => {
                    CONFIG.LOGGING.LOG_FILE = filename;
                    log(LogLevel.INFO, `Log file set to ${filename}`);
                }
            }
        };
    };
}
/**
 * Generate a random unique identifier
 * @returns Random string ID
 */
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
exports.default = initializeDatabase;
