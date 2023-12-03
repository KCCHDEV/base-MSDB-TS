import * as fs from 'fs';
import * as path from 'path';

let folderPath = "./Database";

interface Database {
  [key: string]: any;
}

interface DatabaseFunctions {
  find: (key: string) => any;
  save: (key: string, value: any) => void;
  remove: (key: string) => void;
  random: () => any;
}

function initializeDatabase(databaseName: string): DatabaseFunctions {
  const databaseFilename = path.join(folderPath, `${databaseName}.json`);
  let database: Database = {};

  if (fs.existsSync(databaseFilename)) {
    const data = fs.readFileSync(databaseFilename, 'utf8');
    database = JSON.parse(data);
  }

  function saveDatabase() {
    const data = JSON.stringify(database, null, 2);
    fs.writeFileSync(databaseFilename, data, 'utf8');
  }

  function addToDatabase(key: string, value: any) {
    database[key] = value;
    saveDatabase();
  }

  function getFromDatabase(key: string): any {
    return database[key];
  }

  function removeFromDatabase(key: string) {
    if (database.hasOwnProperty(key)) {
      delete database[key];
      saveDatabase();
    }
  }

  function getRandomEntry(): any {
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

export default initializeDatabase;

// ระบบ MSDB TS เป็นของ MakiShop.xyz และ N&G Dev on way เราได้ให้ทุกคนนำไปใช้งานได้ฟรี