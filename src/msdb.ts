import fs from 'fs';
import path from 'path';

const PART_SIZE = 5000; // Number of entries per file part
const DEBUG = true; // Set to true to enable debug logging
const CACHE_LIMIT = 1000; // Cache limit before flushing to disk

function logDebug(message: string) {
  if (DEBUG) {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
  }
}

/**
 * Creates and initializes a database with the given name.
 * @param {string} databaseName - Name of the database to create.
 * @returns {function} - A function to initialize and manage a table in the database.
 */
function initializeDatabase(databaseName: string) {
  const databaseFolderPath = './Database[LOCAL]';

  if (!fs.existsSync(databaseFolderPath)) {
    fs.mkdirSync(databaseFolderPath, { recursive: true });
  }

  const fullDatabaseFolderPath = path.join(databaseFolderPath, databaseName);
  if (!fs.existsSync(fullDatabaseFolderPath)) {
    fs.mkdirSync(fullDatabaseFolderPath, { recursive: true });
  }

  return function initializeTable(tableName: string) {
    const tableFolderPath = path.join(fullDatabaseFolderPath, tableName);
    if (!fs.existsSync(tableFolderPath)) {
      fs.mkdirSync(tableFolderPath, { recursive: true });
    }

    let tableData: Record<string, any> = loadTableData();
    let cache: Record<string, any> = {};

    /**
     * Loads all table data from partitioned files.
     * @returns {Record<string, any>} - The complete table data.
     */
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

    /**
     * Saves table data into partitioned files.
     */
    function saveTableData() {
      const entries = Object.entries(tableData);
      for (let i = 0; i < entries.length; i += PART_SIZE) {
        const chunk = Object.fromEntries(entries.slice(i, i + PART_SIZE));
        const filePath = path.join(tableFolderPath, `part_${Math.floor(i / PART_SIZE)}.json`);
        fs.writeFileSync(filePath, JSON.stringify(chunk, null, 2), 'utf8');
      }

      // Cleanup unused files if the table shrinks
      const existingFiles = fs.readdirSync(tableFolderPath).filter((file) => file.startsWith('part_'));
      const requiredFileCount = Math.ceil(entries.length / PART_SIZE);
      for (const file of existingFiles.slice(requiredFileCount)) {
        fs.unlinkSync(path.join(tableFolderPath, file));
      }

      logDebug(`Saved table data for ${tableName}`);
    }

    /**
     * Saves or updates an entry in the table.
     * @param {string} id - The unique ID of the entry.
     * @param {object} data - The data to save.
     */
    function saveEntry(id: string, data: any) {
      const entryId = id || generateUniqueId();
      tableData[entryId] = { id: entryId, value: data };
      cache[entryId] = tableData[entryId];

      if (Object.keys(cache).length >= CACHE_LIMIT) {
        saveTableData();
        cache = {};
        logDebug(`Cache flushed for ${tableName}`);
      }
    }

    /**
     * Removes an entry from the table.
     * @param {string} id - The unique ID of the entry to remove.
     */
    function removeEntry(id: string) {
      if (tableData[id]) {
        delete tableData[id];
        saveTableData();
        logDebug(`Removed entry ${id} from ${tableName}`);
      }
    }

    /**
     * Retrieves an entry from the table by ID.
     * @param {string} id - The unique ID of the entry.
     * @returns {object|null} - The entry, or null if not found.
     */
    function getEntry(id: string) {
      const entry = tableData[id] || null;
      logDebug(`Retrieved entry ${id} from ${tableName}`);
      return entry;
    }

    /**
     * Retrieves all entries from the table, optionally sorted by ID.
     * @param {string} orderBy - 'asc' for ascending, 'desc' for descending.
     * @returns {object[]} - An array of all entries.
     */
    function getAllEntries(orderBy = 'asc') {
      const entries = Object.values(tableData);
      const result = entries.sort((a, b) => (orderBy === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
      logDebug(`Retrieved all entries from ${tableName} ordered by ${orderBy}`);
      return result;
    }

    /**
     * Retrieves entries that match a given condition.
     * @param {object} condition - The condition to match.
     * @returns {object[]} - An array of matching entries.
     */
    function getWhere(condition: { [key: string]: any }) {
      const result = Object.values(tableData).filter((entry) => {
        for (const key in condition) {
          if (entry.value[key] !== condition[key]) return false;
        }
        return true;
      });
      logDebug(`Retrieved entries from ${tableName} with condition ${JSON.stringify(condition)}`);
      return result;
    }

    /**
     * Retrieves a random entry from the table.
     * @returns {object|null} - A random entry, or null if the table is empty.
     */
    function getRandomEntry() {
      const keys = Object.keys(tableData);
      if (keys.length === 0) return null;
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const entry = tableData[randomKey];
      logDebug(`Retrieved random entry from ${tableName}`);
      return entry;
    }

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

/**
 * Generates a unique ID.
 * @returns {string} - A unique ID.
 */
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default initializeDatabase;