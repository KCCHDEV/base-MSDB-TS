"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
// ============= CONFIGURATION =============
const CONFIG = {
    FILE_SETTINGS: {
        MAX_ENTRIES_PER_FILE: 5000,
        FILE_PREFIX: 'data',
        FILE_EXTENSION: '.json',
        MAX_FILES: 10000,
        COMPRESSION_THRESHOLD: 1024 * 100, // 100KB
        BACKUP_RETENTION: 10
    },
    CACHE: {
        DEFAULT_SIZE: 1000,
        DEFAULT_LIMIT_MB: 200,
        CHECK_INTERVAL: 30000,
        SAVE_INTERVAL: 5000,
        CLEANUP_INTERVAL: 300000, // 5 minutes
        LRU_MAX_AGE: 3600000 // 1 hour
    },
    AUTH: {
        TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
        SALT_ROUNDS: 12,
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes
    },
    PERFORMANCE: {
        BATCH_SIZE: 100,
        MAX_CONCURRENT_OPERATIONS: 10,
        MEMORY_THRESHOLD: 0.8, // 80% of available memory
        GC_THRESHOLD: 1000,
        INDEX_REBUILD_THRESHOLD: 0.3 // 30% deleted entries
    },
    LOGGING: {
        ENABLED: true,
        DEBUG: false,
        FILE: true,
        CONSOLE: false,
        PATH: './logs',
        PREFIX: 'msdb',
        ROTATE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_FILES: 50
    }
};
// ============= UTILITY CLASSES =============
class Logger {
    constructor() {
        this.logPath = path.join(process.cwd(), CONFIG.LOGGING.PATH);
        this.currentLogFile = this.getLogFileName();
        fs.mkdirSync(this.logPath, { recursive: true });
        this.setupLogRotation();
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    getLogFileName() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        return path.join(this.logPath, `${CONFIG.LOGGING.PREFIX}-${dateStr}.log`);
    }
    setupLogRotation() {
        this.logRotationTimer = setInterval(() => {
            const newLogFile = this.getLogFileName();
            if (newLogFile !== this.currentLogFile) {
                this.currentLogFile = newLogFile;
                this.cleanupOldLogs();
            }
        }, 60000); // Check every minute
    }
    cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.logPath)
                .filter((f) => f.startsWith(CONFIG.LOGGING.PREFIX))
                .sort()
                .reverse();
            if (files.length > CONFIG.LOGGING.MAX_FILES) {
                const filesToDelete = files.slice(CONFIG.LOGGING.MAX_FILES);
                filesToDelete.forEach((file) => {
                    fs.unlinkSync(path.join(this.logPath, file));
                });
            }
        }
        catch (error) {
            console.error('Error cleaning up logs:', error);
        }
    }
    log(level, message, data) {
        if (!CONFIG.LOGGING.ENABLED)
            return;
        if (level === 'debug' && !CONFIG.LOGGING.DEBUG)
            return;
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: data ? JSON.stringify(data) : undefined
        };
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
        if (CONFIG.LOGGING.CONSOLE) {
            console.log(logLine.trim());
        }
        if (CONFIG.LOGGING.FILE) {
            fs.appendFileSync(this.currentLogFile, logLine);
        }
    }
    destroy() {
        if (this.logRotationTimer) {
            clearInterval(this.logRotationTimer);
        }
    }
}
class LRUCache extends events_1.EventEmitter {
    constructor(maxSize = CONFIG.CACHE.DEFAULT_SIZE, maxMemoryMB = CONFIG.CACHE.DEFAULT_LIMIT_MB) {
        super();
        this.cache = new Map();
        this.accessOrder = [];
        this.currentMemoryBytes = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.maxSize = maxSize;
        this.maxMemoryMB = maxMemoryMB;
        this.startCleanupTimer();
    }
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, CONFIG.CACHE.CLEANUP_INTERVAL);
    }
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }
    calculateSize(value) {
        return JSON.stringify(value).length * 2; // Rough estimate: 2 bytes per char
    }
    evictLRU() {
        while (this.accessOrder.length > 0 &&
            (this.cache.size >= this.maxSize ||
                this.currentMemoryBytes > this.maxMemoryMB * 1024 * 1024)) {
            const oldestKey = this.accessOrder.shift();
            if (oldestKey && this.cache.has(oldestKey)) {
                const entry = this.cache.get(oldestKey);
                this.currentMemoryBytes -= entry.size;
                this.cache.delete(oldestKey);
                this.emit('evicted', oldestKey, entry.value);
            }
        }
    }
    set(key, value) {
        const size = this.calculateSize(value);
        const now = Date.now();
        if (this.cache.has(key)) {
            const oldEntry = this.cache.get(key);
            this.currentMemoryBytes -= oldEntry.size;
        }
        this.cache.set(key, { value, accessTime: now, size });
        this.currentMemoryBytes += size;
        this.updateAccessOrder(key);
        this.evictLRU();
    }
    get(key) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.accessTime = Date.now();
            this.updateAccessOrder(key);
            this.hitCount++;
            return entry.value;
        }
        this.missCount++;
        return null;
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentMemoryBytes -= entry.size;
            const index = this.accessOrder.indexOf(key);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
            return this.cache.delete(key);
        }
        return false;
    }
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.currentMemoryBytes = 0;
        this.hitCount = 0;
        this.missCount = 0;
    }
    cleanup() {
        const now = Date.now();
        const maxAge = CONFIG.CACHE.LRU_MAX_AGE;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.accessTime > maxAge) {
                this.delete(key);
            }
        }
    }
    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            memoryMB: this.currentMemoryBytes / (1024 * 1024),
            hitRate: total > 0 ? this.hitCount / total : 0,
            hitCount: this.hitCount,
            missCount: this.missCount
        };
    }
}
class FileManager {
    constructor(basePath, tableName, compressionEnabled = false) {
        this.currentFileIndex = 0;
        this.currentEntryCount = 0;
        this.writeQueue = [];
        this.isWriting = false;
        this.indices = new Map();
        this.basePath = basePath;
        this.tableName = tableName;
        this.compressionEnabled = compressionEnabled;
        this.logger = Logger.getInstance();
        this.dataCache = new LRUCache(CONFIG.CACHE.DEFAULT_SIZE, CONFIG.CACHE.DEFAULT_LIMIT_MB);
        fs.mkdirSync(basePath, { recursive: true });
        this.loadExistingFiles();
        this.setupPeriodicSave();
    }
    setupPeriodicSave() {
        setInterval(() => {
            this.processWriteQueue();
        }, CONFIG.CACHE.SAVE_INTERVAL);
    }
    async loadExistingFiles() {
        try {
            const files = fs.readdirSync(this.basePath)
                .filter(f => f.startsWith(CONFIG.FILE_SETTINGS.FILE_PREFIX))
                .sort();
            for (const file of files) {
                const filePath = path.join(this.basePath, file);
                const data = await this.readFileData(filePath);
                const fileIndex = parseInt(file.split('.')[1] || '0');
                this.dataCache.set(file, data);
                this.currentFileIndex = Math.max(this.currentFileIndex, fileIndex);
                this.currentEntryCount = Object.keys(data).length;
                // Build indices
                this.buildIndicesFromData(data);
            }
            this.logger.log('info', `Loaded ${files.length} files for table ${this.tableName}`);
        }
        catch (error) {
            this.logger.log('error', `Error loading files for table ${this.tableName}`, error);
        }
    }
    async readFileData(filePath) {
        try {
            const rawData = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(rawData);
        }
        catch (error) {
            this.logger.log('error', `Error reading file ${filePath}`, error);
            return {};
        }
    }
    buildIndicesFromData(data) {
        for (const [id, entry] of Object.entries(data)) {
            if (entry?.value) {
                this.updateIndices(id, entry.value, 'add');
            }
        }
    }
    updateIndices(id, data, operation) {
        for (const [field, indexMap] of this.indices.entries()) {
            const value = data[field];
            if (value !== undefined) {
                if (operation === 'add') {
                    if (!indexMap.has(value)) {
                        indexMap.set(value, new Set());
                    }
                    indexMap.get(value).add(id);
                }
                else {
                    const idSet = indexMap.get(value);
                    if (idSet) {
                        idSet.delete(id);
                        if (idSet.size === 0) {
                            indexMap.delete(value);
                        }
                    }
                }
            }
        }
    }
    async write(id, entry) {
        return new Promise((resolve, reject) => {
            this.writeQueue.push(async () => {
                try {
                    await this.performWrite(id, entry);
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
            if (!this.isWriting) {
                this.processWriteQueue();
            }
        });
    }
    async processWriteQueue() {
        if (this.isWriting || this.writeQueue.length === 0)
            return;
        this.isWriting = true;
        const batchSize = Math.min(CONFIG.PERFORMANCE.BATCH_SIZE, this.writeQueue.length);
        const batch = this.writeQueue.splice(0, batchSize);
        try {
            await Promise.all(batch.map(operation => operation()));
        }
        catch (error) {
            this.logger.log('error', 'Error processing write queue', error);
        }
        finally {
            this.isWriting = false;
            if (this.writeQueue.length > 0) {
                setImmediate(() => this.processWriteQueue());
            }
        }
    }
    async performWrite(id, entry) {
        let currentFilePath = this.getCurrentFilePath();
        let currentData = this.dataCache.get(path.basename(currentFilePath)) || {};
        // Check if current file is full
        if (Object.keys(currentData).length >= CONFIG.FILE_SETTINGS.MAX_ENTRIES_PER_FILE) {
            this.currentFileIndex++;
            currentFilePath = this.getCurrentFilePath();
            currentData = {};
        }
        // Update indices
        if (currentData[id]) {
            this.updateIndices(id, currentData[id].value, 'remove');
        }
        this.updateIndices(id, entry.value, 'add');
        // Update data
        currentData[id] = entry;
        this.dataCache.set(path.basename(currentFilePath), currentData);
        // Write to disk
        await fs.promises.writeFile(currentFilePath, JSON.stringify(currentData, null, 2));
        this.currentEntryCount = Object.keys(currentData).length;
        this.logger.log('debug', `Wrote entry ${id} to ${currentFilePath}`);
    }
    async read(id) {
        // Check cache first
        for (const [_, data] of this.dataCache.cache.entries()) {
            if (data.value[id]) {
                return data.value[id];
            }
        }
        // Check disk
        return this.readFromDisk(id);
    }
    async readFromDisk(id) {
        try {
            const files = await fs.promises.readdir(this.basePath);
            for (const file of files) {
                if (!file.startsWith(CONFIG.FILE_SETTINGS.FILE_PREFIX))
                    continue;
                const filePath = path.join(this.basePath, file);
                const data = await this.readFileData(filePath);
                if (id in data) {
                    this.dataCache.set(file, data); // Cache the file data
                    return data[id];
                }
            }
        }
        catch (error) {
            this.logger.log('error', `Error reading from disk for ID ${id}`, error);
        }
        return null;
    }
    getCurrentFilePath() {
        const paddedIndex = String(this.currentFileIndex).padStart(5, '0');
        return path.join(this.basePath, `${CONFIG.FILE_SETTINGS.FILE_PREFIX}.${paddedIndex}${CONFIG.FILE_SETTINGS.FILE_EXTENSION}`);
    }
    createIndex(field) {
        if (!this.indices.has(field)) {
            this.indices.set(field, new Map());
            this.rebuildIndex(field);
            this.logger.log('info', `Created index for field: ${field}`);
        }
    }
    rebuildIndex(field) {
        const indexMap = this.indices.get(field);
        indexMap.clear();
        for (const [_, data] of this.dataCache.cache.entries()) {
            for (const [id, entry] of Object.entries(data.value)) {
                if (entry?.value?.[field] !== undefined) {
                    const value = entry.value[field];
                    if (!indexMap.has(value)) {
                        indexMap.set(value, new Set());
                    }
                    indexMap.get(value).add(id);
                }
            }
        }
    }
    dropIndex(field) {
        this.indices.delete(field);
        this.logger.log('info', `Dropped index for field: ${field}`);
    }
    getByIndex(field, value) {
        const indexMap = this.indices.get(field);
        if (!indexMap)
            return [];
        const ids = indexMap.get(value);
        if (!ids)
            return [];
        const results = [];
        for (const id of ids) {
            const entry = this.read(id);
            if (entry) {
                results.push(entry);
            }
        }
        return results;
    }
    listIndices() {
        return Array.from(this.indices.keys());
    }
    getStats() {
        return {
            ...this.dataCache.getStats(),
            writeQueueSize: this.writeQueue.length,
            indicesCount: this.indices.size,
            currentFileIndex: this.currentFileIndex,
            currentEntryCount: this.currentEntryCount
        };
    }
}
class DataManager {
    constructor(basePath) {
        this.cache = new Map();
        this.saveQueue = [];
        this.isSaving = false;
        this.fileManager = new FileManager(basePath, '', false);
        this.processSaveQueue();
    }
    async save(id, value) {
        return new Promise((resolve, reject) => {
            const now = Date.now();
            const entry = {
                id,
                value,
                created_at: now,
                updated_at: now,
                version: 1
            };
            this.cache.set(id, entry);
            this.saveQueue.push(async () => {
                try {
                    await this.fileManager.write(id, entry);
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
            if (!this.isSaving) {
                this.processSaveQueue();
            }
        });
    }
    async processSaveQueue() {
        if (this.isSaving || this.saveQueue.length === 0)
            return;
        this.isSaving = true;
        while (this.saveQueue.length > 0) {
            const saveOperation = this.saveQueue.shift();
            if (saveOperation) {
                try {
                    await saveOperation();
                }
                catch (error) {
                    console.error('Save operation failed:', error);
                }
            }
        }
        this.isSaving = false;
    }
    get(id) {
        // Changed to sync method since we're just checking cache
        return this.cache.get(id) || null;
    }
    getAll() {
        // Changed to sync method
        return Array.from(this.cache.values());
    }
    getWhere(condition) {
        return Array.from(this.cache.values()).filter(entry => {
            for (const [key, value] of Object.entries(condition)) {
                if (entry.value[key] !== value)
                    return false;
            }
            return true;
        });
    }
    random() {
        const entries = Array.from(this.cache.values());
        if (entries.length === 0)
            return null;
        return entries[Math.floor(Math.random() * entries.length)];
    }
    remove(id) {
        this.cache.delete(id);
    }
}
function initializeDatabase(name) {
    const basePath = path.join(process.cwd(), 'db', name);
    return function createTable(tableName) {
        const manager = new DataManager(path.join(basePath, tableName));
        return {
            find: async (id) => manager.get(id),
            findSync: (id) => manager.get(id),
            save: (id, data) => manager.save(id, data),
            saveMany: async (entries) => {
                for (const entry of entries) {
                    await manager.save(entry.id, entry.data);
                }
            },
            update: async (id, updates) => {
                const existing = manager.get(id);
                if (existing) {
                    const updated = { ...existing.value, ...updates };
                    await manager.save(id, updated);
                    return true;
                }
                return false;
            },
            remove: async (id) => {
                const exists = manager.get(id) !== null;
                manager.remove(id);
                return exists;
            },
            removeMany: async (ids) => {
                let count = 0;
                for (const id of ids) {
                    if (manager.get(id)) {
                        manager.remove(id);
                        count++;
                    }
                }
                return count;
            },
            getAll: async (options) => {
                const entries = manager.getAll();
                if (options?.orderBy) {
                    return options.order === 'desc'
                        ? entries.sort((a, b) => b.id.localeCompare(a.id))
                        : entries.sort((a, b) => a.id.localeCompare(b.id));
                }
                return entries;
            },
            getAllSync: (options) => {
                const entries = manager.getAll();
                if (options?.orderBy) {
                    return options.order === 'desc'
                        ? entries.sort((a, b) => b.id.localeCompare(a.id))
                        : entries.sort((a, b) => a.id.localeCompare(b.id));
                }
                return entries;
            },
            getWhere: async (condition, options) => manager.getWhere(condition),
            getWhereSync: (condition, options) => manager.getWhere(condition),
            count: async (condition) => {
                return condition ? manager.getWhere(condition).length : manager.getAll().length;
            },
            exists: async (id) => manager.get(id) !== null,
            random: async (count = 1) => {
                const entries = manager.getAll();
                if (entries.length === 0)
                    return [];
                const result = [];
                for (let i = 0; i < Math.min(count, entries.length); i++) {
                    const randomIndex = Math.floor(Math.random() * entries.length);
                    result.push(entries[randomIndex]);
                }
                return result;
            },
            findBy: async (field, value, options) => {
                return manager.getAll().filter(entry => entry.value[field] === value);
            },
            search: async (query, fields) => {
                return manager.getAll().filter(entry => {
                    const searchFields = fields || Object.keys(entry.value);
                    return searchFields.some(field => String(entry.value[field]).toLowerCase().includes(query.toLowerCase()));
                });
            },
            aggregate: async (field, operation) => {
                const entries = manager.getAll();
                const values = entries.map(e => Number(e.value[field])).filter(v => !isNaN(v));
                switch (operation) {
                    case 'sum': return values.reduce((a, b) => a + b, 0);
                    case 'avg': return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    case 'min': return Math.min(...values);
                    case 'max': return Math.max(...values);
                    case 'count': return values.length;
                    default: return 0;
                }
            },
            createIndex: async (field) => {
                // Implementation would be in FileManager
            },
            dropIndex: async (field) => {
                // Implementation would be in FileManager  
            },
            listIndices: () => [],
            transaction: async (operations) => {
                try {
                    for (const op of operations) {
                        switch (op.type) {
                            case 'save':
                                await manager.save(op.id, op.data);
                                break;
                            case 'remove':
                                manager.remove(op.id);
                                break;
                            case 'update':
                                const existing = manager.get(op.id);
                                if (existing) {
                                    await manager.save(op.id, { ...existing.value, ...op.data });
                                }
                                break;
                        }
                    }
                    return true;
                }
                catch (error) {
                    return false;
                }
            },
            backup: async (filename) => {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                return `backup-${timestamp}.json`;
            },
            restore: async (filename) => {
                // Implementation for restore
            },
            compact: async () => {
                // Implementation for compaction
            },
            vacuum: async () => {
                // Implementation for vacuum
            },
            stats: async () => {
                const entries = manager.getAll();
                return {
                    totalEntries: entries.length,
                    fileSize: 0,
                    memoryUsage: 0,
                    lastAccess: Date.now(),
                    cacheHitRate: 0
                };
            },
            config: {
                toggleLogging: (enabled) => { },
                toggleDebug: (enabled) => { },
                setLogFile: (filename) => { },
                setCacheLimit: (limit) => { },
                setCacheSizeMB: (size) => { },
                setTableConfig: (config) => { },
                getTableConfig: () => ({
                    enableAuth: false,
                    enableCache: true,
                    enableCompression: false,
                    maxCacheSize: 1000,
                    maxFileSize: 5000,
                    autoBackup: false,
                    enableIndices: false,
                    enableVersioning: false
                })
            }
        };
    };
}
exports.default = initializeDatabase;
