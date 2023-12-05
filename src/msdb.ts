import fs from "fs";
import path from "path";

class Table {
    private tableData: Record<string, any>;
    private tableFilename: string;

    constructor(tableFilename: string) {
        this.tableFilename = tableFilename;
        this.tableData = this.loadTableData();
    }
    private loadTableData(): Record<string, any> {
        if (fs.existsSync(this.tableFilename)) {
            const data = fs.readFileSync(this.tableFilename, 'utf8');
            return JSON.parse(data);
        }
        return {};
    }

    private saveTableData(): void {
        const jsonData = JSON.stringify(this.tableData, null, 2);
        fs.writeFileSync(this.tableFilename, jsonData, 'utf8');
    }

    save(id: string, data: any): void {
        this.tableData[id] = {
            id,
            value: data.value || data || null,
        };
        this.saveTableData();
    }

    remove(id: string): void {
        if (this.tableData.hasOwnProperty(id)) {
            delete this.tableData[id];
            this.saveTableData();
        }
    }

    find(id: string): any {
        return this.tableData[id];
    }

    random(): any | null {
        const keys = Object.keys(this.tableData);
        if (keys.length === 0) {
            return null;
        }
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return this.tableData[randomKey];
    }
    getAll(orderBy: 'asc' | 'desc' = 'asc'): any[] {
        const entries = Object.values(this.tableData);

        if (orderBy === 'desc') {
            entries.sort((a, b) => (a.id > b.id ? -1 : 1));
        } else {
            entries.sort((a, b) => (a.id > b.id ? 1 : -1));
        }

        return entries;
    }

    getWhere(condition: Record<string, any>): any[] {
        const entries = Object.values(this.tableData);
        return entries.filter(entry => {
            for (const key in condition) {
                if (entry[key] !== condition[key]) {
                    return false;
                }
            }
            return true;
        });
    }
}

class Database {
    private readonly databaseFolderPath: string;
    private readonly fullDatabaseFolderPath: string;

    constructor(databaseName: string) {
        this.databaseFolderPath = path.resolve(__dirname, 'MakiShop_Database');
        if (!fs.existsSync(this.databaseFolderPath)) {
            try {
                fs.mkdirSync(this.databaseFolderPath);
                console.log(`Database folder created at: ${this.databaseFolderPath}`);
            } catch (error) {
                console.error('Error creating database folder:', error);
            }
        }
        this.fullDatabaseFolderPath = path.join(this.databaseFolderPath, databaseName);
        if (!fs.existsSync(this.fullDatabaseFolderPath)) {
            try {
                fs.mkdirSync(this.fullDatabaseFolderPath);
                console.log(`Database folder created at: ${this.fullDatabaseFolderPath}`);
            } catch (error) {
                console.error('Error creating full database folder:', error);
            }
        }
    }

    table(tableName: string): Table {
        const tableFilename = path.join(this.fullDatabaseFolderPath, `${tableName}.json`);
        return new Table(tableFilename);
    }
}

export default Database;
