import fs from 'node:fs';
import path from 'node:path';

interface DatabaseEntry<T = any> {
    id: string;
    value: T;
}

interface TableMethods<T = any> {
    find: (id: string) => DatabaseEntry<T> | null;
    save: (id: string, data: T) => Promise<void>;
    remove: (id: string) => Promise<void>;
    random: () => DatabaseEntry<T> | null;
    getAll: (orderBy?: 'asc' | 'desc') => DatabaseEntry<T>[];
    getWhere: (condition: Partial<T>) => DatabaseEntry<T>[];
    config: {
        toggleLogging: (enabled: boolean) => void;
        toggleDebug: (enabled: boolean) => void;
        setLogFile: (filename: string) => void;
        setCacheLimit: (limit: number) => void;
        setCacheSizeMB: (size: number) => void;
        setCacheQueueSize: (size: number) => void;
    };
}

const CONFIG = {
    FILE_SETTINGS: {
        MAX_ENTRIES_PER_FILE: 2500,   // Maximum entries per file
        FILE_PREFIX: 'data',
        FILE_EXTENSION: '.json',
        MAX_FILES: 1000,
        COMPRESSION: false            // Future use for compression
    },
    CACHE: {
        SIZE: 100,
        LIMIT_MB: 100,
        CHECK_INTERVAL: 5000,
        SAVE_INTERVAL: 1000
    },
    LOGGING: {
        ENABLED: true,
        DEBUG: false,
        FILE: true,
        CONSOLE: true,
        PATH: './logs',
        PREFIX: 'db',
        ROTATE: 3600000,
        MAX_FILES: 168,
    }
};

class FileManager {
    private currentFileIndex = 0;
    private currentEntryCount = 0;
    private readonly basePath: string;
    private dataCache: Map<string, Record<string, any>> = new Map();

    constructor(basePath: string) {
        this.basePath = basePath;
        fs.mkdirSync(basePath, { recursive: true });
        this.loadExistingFiles();
    }

    private async loadExistingFiles() {
        const files = fs.readdirSync(this.basePath)
            .filter(f => f.startsWith(CONFIG.FILE_SETTINGS.FILE_PREFIX))
            .sort();

        for (const file of files) {
            try {
                const filePath = path.join(this.basePath, file);
                const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
                const fileIndex = parseInt(file.split('.')[1]);
                
                this.dataCache.set(file, data);
                this.currentFileIndex = Math.max(this.currentFileIndex, fileIndex);
                this.currentEntryCount = Object.keys(data).length;
            } catch (error) {
                console.error(`Error loading file ${file}:`, error);
            }
        }
    }

    async write<T>(id: string, entry: T): Promise<void> {
        let currentFilePath = this.getCurrentFilePath();
        let currentData = this.dataCache.get(path.basename(currentFilePath)) || {};

        // If current file is full, create new file
        if (Object.keys(currentData).length >= CONFIG.FILE_SETTINGS.MAX_ENTRIES_PER_FILE) {
            this.currentFileIndex++;
            currentFilePath = this.getCurrentFilePath();
            currentData = {};
        }

        // Update data
        currentData[id] = entry;
        this.dataCache.set(path.basename(currentFilePath), currentData);
        
        // Write to disk
        try {
            await fs.promises.writeFile(
                currentFilePath,
                JSON.stringify(currentData, null, 2)
            );
            this.currentEntryCount = Object.keys(currentData).length;
        } catch (error) {
            console.error(`Error writing file ${currentFilePath}:`, error);
            throw error;
        }
    }

    async read<T>(id: string): Promise<T | null> {
        // Check all cached files
        for (const [_, data] of this.dataCache) {
            if (id in data) return data[id];
        }

        // If not in cache, check disk
        return this.readFromDisk(id);
    }

    private async readFromDisk<T>(id: string): Promise<T | null> {
        const files = await fs.promises.readdir(this.basePath);
        
        for (const file of files) {
            if (!file.startsWith(CONFIG.FILE_SETTINGS.FILE_PREFIX)) continue;

            const filePath = path.join(this.basePath, file);
            try {
                const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
                if (id in data) {
                    this.dataCache.set(file, data); // Cache the file data
                    return data[id];
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        }
        return null;
    }

    private getCurrentFilePath(): string {
        const paddedIndex = String(this.currentFileIndex).padStart(5, '0');
        return path.join(
            this.basePath,
            `${CONFIG.FILE_SETTINGS.FILE_PREFIX}.${paddedIndex}${CONFIG.FILE_SETTINGS.FILE_EXTENSION}`
        );
    }
}

class DataManager<T> {
    private fileManager: FileManager;
    private cache = new Map<string, DatabaseEntry<T>>();
    private saveQueue: Array<() => Promise<void>> = [];
    private isSaving = false;

    constructor(basePath: string) {
        this.fileManager = new FileManager(basePath);
        this.processSaveQueue();
    }

    async save(id: string, value: T): Promise<void> {
        return new Promise((resolve, reject) => {
            const entry: DatabaseEntry<T> = { id, value };
            this.cache.set(id, entry);
            
            this.saveQueue.push(async () => {
                try {
                    await this.fileManager.write(id, entry);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            if (!this.isSaving) {
                this.processSaveQueue();
            }
        });
    }

    private async processSaveQueue() {
        if (this.isSaving || this.saveQueue.length === 0) return;
        
        this.isSaving = true;
        while (this.saveQueue.length > 0) {
            const saveOperation = this.saveQueue.shift();
            if (saveOperation) {
                try {
                    await saveOperation();
                } catch (error) {
                    console.error('Save operation failed:', error);
                }
            }
        }
        this.isSaving = false;
    }

    get(id: string): DatabaseEntry<T> | null {
        // Changed to sync method since we're just checking cache
        return this.cache.get(id) || null;
    }

    getAll(): DatabaseEntry<T>[] {
        // Changed to sync method
        return Array.from(this.cache.values());
    }

    getWhere(condition: Partial<T>): DatabaseEntry<T>[] {
        return Array.from(this.cache.values()).filter(entry => {
            for (const [key, value] of Object.entries(condition)) {
                if (entry.value[key as keyof T] !== value) return false;
            }
            return true;
        });
    }

    random(): DatabaseEntry<T> | null {
        const entries = Array.from(this.cache.values());
        if (entries.length === 0) return null;
        return entries[Math.floor(Math.random() * entries.length)];
    }

    remove(id: string): void {
        this.cache.delete(id);
    }
}

function initializeDatabase(name: string) {
    const basePath = path.join(process.cwd(), 'db', name);
    
    return function createTable<T>(tableName: string): TableMethods<T> {
        const manager = new DataManager<T>(path.join(basePath, tableName));

        return {
            find: (id) => manager.get(id),
            save: (id, data) => manager.save(id, data),
            remove: async (id) => {
                // Use the public remove method instead of accessing private cache
                manager.remove(id);
            },
            random: () => manager.random(),
            getAll: (orderBy) => {
                const entries = manager.getAll();
                return orderBy === 'desc' 
                    ? entries.sort((a, b) => b.id.localeCompare(a.id))
                    : entries.sort((a, b) => a.id.localeCompare(b.id));
            },
            getWhere: (condition) => manager.getWhere(condition),
            config: {
                toggleLogging: () => {},
                toggleDebug: () => {},
                setLogFile: () => {},
                setCacheLimit: () => {},
                setCacheSizeMB: () => {},
                setCacheQueueSize: () => {}
            }
        };
    };
}

export default initializeDatabase;