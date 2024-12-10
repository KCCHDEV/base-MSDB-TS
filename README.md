# 🗄️ base-MSDB-TS (MSDBTS V17)

A lightweight, file-based database system for TypeScript projects with caching and debug capabilities.
ระบบฐานข้อมูลแบบไฟล์ที่มีน้ำหนักเบาสำหรับโปรเจค TypeScript พร้อมระบบแคชและการดีบัก

## 📋 Requirements / ความต้องการระบบ

Install one of the following package managers and required dependencies:
ติดตั้งตัวจัดการแพ็คเกจตัวใดตัวหนึ่งและแพ็คเกจที่จำเป็น:

```bash
# Using npm
npm i --save fs path @types/node

# Using pnpm
pnpm i --save fs path @types/node

# Using bun
bun i fs path @types/node

# Using yarn
yarn add fs path @types/node
```

## 🚀 Features / คุณสมบัติ

- 📦 File-based storage / การจัดเก็บแบบไฟล์
- 🔄 Automatic data partitioning / การแบ่งข้อมูลอัตโนมัติ
- ⚡ Caching system / ระบบแคช
- 🐛 Debug logging / การบันทึกการดีบัก
- 🔍 Flexible querying / การค้นหาข้อมูลที่ยืดหยุ่น

## 📖 Usage / วิธีการใช้งาน

### Basic Example / ตัวอย่างการใช้งานพื้นฐาน

```typescript
import initializeDatabase from './msdb';

// Initialize database / สร้างฐานข้อมูล
const myDatabase = initializeDatabase('myDatabase');
const myTable = myDatabase('myTable');

// Save data / บันทึกข้อมูล
myTable.save('key1', { value: 'value1' });
myTable.save('key2', { value: 'value2' });
myTable.save('key3', { value: 'value3' });

// Find entry / ค้นหาข้อมูล
const foundEntry = myTable.find('key1');
console.log('Found entry:', foundEntry);

// Remove entry / ลบข้อมูล
myTable.remove('key2');

// Get random entry / ดึงข้อมูลแบบสุ่ม
const randomEntry = myTable.random();

// Get all entries (ascending) / ดึงข้อมูลทั้งหมด (เรียงจากน้อยไปมาก)
const allEntriesAsc = myTable.getAll('asc');

// Get all entries (descending) / ดึงข้อมูลทั้งหมด (เรียงจากมากไปน้อย)
const allEntriesDesc = myTable.getAll('desc');

// Query with condition / ค้นหาด้วยเงื่อนไข
const condition = { value: 'value1' };
const entriesWithCondition = myTable.getWhere(condition);
```

### 🔧 Advanced Features / คุณสมบัติขั้นสูง

#### Caching / ระบบแคช
- Automatically caches up to 1000 entries
- Flushes to disk when cache limit is reached
- อัตโนมัติแคชสูงสุด 1000 รายการ
- บันทึกลงดิสก์เมื่อถึงขีดจำกัดแคช

#### Debug Logging / การบันทึกการดีบัก
- Enable debug mode to log operations
- Logs stored in debug.log file
- เปิดใช้งานโหมดดีบักเพื่อบันทึกการทำงาน
- บันทึกถูกเก็บในไฟล์ debug.log

## 🤝 Contributing / การมีส่วนร่วม

Contributions are welcome! Please feel free to submit a Pull Request.
ยินดีรับการมีส่วนร่วม! โปรดส่ง Pull Request ได้อย่างอิสระ

## 📄 License / ลิขสิทธิ์

MIT License
ลิขสิทธิ์ MIT
