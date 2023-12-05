# base-MSDB-TS (MSDBTS V1.5)

## Requirement for MSDB

```bash
npm i --save fs path @types/node
OR
pnpm i --save fs path @types/node
OR
bun i fs path @types/node
OR 
yarn i fs path @types/node
```


## how to use (TypeScrip)
```ts
import Database from './msdb';

// สร้างอ็อบเจ็กต์ใหม่ของคลาส Database
const myDatabase = new Database('myDatabase');

// สร้างตารางในฐานข้อมูล
const myTable = myDatabase.table('myTable');

// บันทึกรายการในตาราง
myTable.save('key1', { value: 'value1' });
myTable.save('key2', { value: 'value2' });
myTable.save('key3', { value: 'value3' });

// ค้นหารายการและพิมพ์ข้อมูล
const foundEntry = myTable.find('key1');
console.log('พบรายการ:', foundEntry);

// ลบรายการจากตาราง
myTable.remove('key2');
console.log('ตารางหลังการลบ key2:', myTable.getAll());

// ดึงข้อมูลจากรายการที่สุ่ม
const randomEntry = myTable.random();
console.log('รายการสุ่ม:', randomEntry);

// ดึงข้อมูลทั้งหมดในลำดับน้อยไปสูง
const allEntriesAsc = myTable.getAll();
console.log('รายการทั้งหมด (ลำดับน้อยไปสูง):', allEntriesAsc);

// ดึงข้อมูลทั้งหมดในลำดับสูงไปน้อย
const allEntriesDesc = myTable.getAll('desc');
console.log('รายการทั้งหมด (ลำดับสูงไปน้อย):', allEntriesDesc);

// ดึงข้อมูลที่ตรงตามเงื่อนไข
const condition = { value: 'value1' };
const entriesWithCondition = myTable.getWhere(condition);
console.log('รายการที่ตรงตามเงื่อนไข:', entriesWithCondition);
```

## RAW Code
```ts
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

```
