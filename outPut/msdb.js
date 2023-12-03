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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let folderPath = "./Database";
function initializeDatabase(databaseName) {
    const databaseFilename = path.join(folderPath, `${databaseName}.json`);
    let database = {};
    if (fs.existsSync(databaseFilename)) {
        const data = fs.readFileSync(databaseFilename, 'utf8');
        database = JSON.parse(data);
    }
    function saveDatabase() {
        const data = JSON.stringify(database, null, 2);
        fs.writeFileSync(databaseFilename, data, 'utf8');
    }
    function addToDatabase(key, value) {
        database[key] = value;
        saveDatabase();
    }
    function getFromDatabase(key) {
        return database[key];
    }
    function removeFromDatabase(key) {
        if (database.hasOwnProperty(key)) {
            delete database[key];
            saveDatabase();
        }
    }
    function getRandomEntry() {
        const keys = Object.keys(database);
        if (keys.length === 0) {
            return null;
        }
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return database[randomKey];
    }
    return {
        find: getFromDatabase,
        save: addToDatabase,
        remove: removeFromDatabase,
        random: getRandomEntry,
    };
}
exports.default = initializeDatabase;
