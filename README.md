# 🗄️ base-MSDB-TS (MSDBTS V17)

[English](#english-documentation) | [ภาษาไทย](#thai-documentation)

Quick Navigation / การนำทางด่วน:
- [Installation / การติดตั้ง](#installation--การติดตั้ง)
- [Basic Usage / การใช้งานพื้นฐาน](#basic-usage--การใช้งานพื้นฐาน)
- [Advanced Features / คุณสมบัติขั้นสูง](#advanced-features--คุณสมบัติขั้นสูง)
- [Configuration / การตั้งค่า](#configuration--การตั้งค่า)

---

# English Documentation

## Installation / การติดตั้ง

1. Create a new TypeScript project:
```bash
mkdir my-db-project
cd my-db-project
npm init -y
npm install typescript @types/node --save-dev
```

2. Copy the MSDB files:
```bash
src/
  ├── msdb.ts       # Main database file
  ├── index.ts      # Example usage
  └── test_bigData.ts # Performance testing
```

3. Configure TypeScript:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Basic Usage

```typescript
import initializeDatabase from './msdb';

// 1. Create a database
const db = initializeDatabase('myShop');

// 2. Define your data structure
interface Product {
    name: string;
    price: number;
    stock: number;
}

// 3. Create a table with type safety
const products = db<Product>('products');

// 4. Add data
products.save('apple', {
    name: 'Apple',
    price: 0.5,
    stock: 100
});

// 5. Query data
const apple = products.find('apple');
const cheapProducts = products.getWhere({ price: 0.5 });
const allProducts = products.getAll('asc');
```

## Advanced Features

```typescript
// Enable logging
products.config.toggleLogging(true);
products.config.setLogFile('shop.log');

// Batch operations
const fruits = [
    { name: 'Orange', price: 0.6, stock: 80 },
    { name: 'Banana', price: 0.3, stock: 150 }
];

fruits.forEach((fruit, index) => {
    products.save(`fruit${index}`, fruit);
});

// Advanced queries
const inStock = products.getWhere({ stock: { $gt: 0 } });
const sortedByPrice = products.getAll('desc');
```

---

# Thai Documentation

## การติดตั้ง

1. สร้างโปรเจค TypeScript ใหม่:
```bash
mkdir my-db-project
cd my-db-project
npm init -y
npm install typescript @types/node --save-dev
```

2. คัดลอกไฟล์ MSDB:
```bash
src/
  ├── msdb.ts       # ไฟล์ฐานข้อมูลหลัก
  ├── index.ts      # ตัวอย่างการใช้งาน
  └── test_bigData.ts # ทดสอบประสิทธิภาพ
```

## การใช้งานพื้นฐาน

```typescript
import initializeDatabase from './msdb';

// 1. สร้างฐานข้อมูล
const db = initializeDatabase('ร้านค้า');

// 2. กำหนดโครงสร้างข้อมูล
interface Product {
    name: string;    // ชื่อสินค้า
    price: number;   // ราคา
    stock: number;   // จำนวนในสต็อก
}

// 3. สร้างตารางพร้อมการตรวจสอบประเภทข้อมูล
const products = db<Product>('products');

// 4. เพิ่มข้อมูล
products.save('apple', {
    name: 'แอปเปิ้ล',
    price: 20,
    stock: 100
});

// 5. ค้นหาข้อมูล
const apple = products.find('apple');
const cheapProducts = products.getWhere({ price: 20 });
const allProducts = products.getAll('asc');
```

## คุณสมบัติขั้นสูง

```typescript
// เปิดการบันทึกล็อก
products.config.toggleLogging(true);
products.config.setLogFile('shop.log');

// การทำงานแบบกลุ่ม
const fruits = [
    { name: 'ส้ม', price: 25, stock: 80 },
    { name: 'กล้วย', price: 15, stock: 150 }
];

fruits.forEach((fruit, index) => {
    products.save(`fruit${index}`, fruit);
});

// การค้นหาขั้นสูง
const inStock = products.getWhere({ stock: { $gt: 0 } });
const sortedByPrice = products.getAll('desc');
```

## การตั้งค่า / Configuration

```typescript
const CONFIG = {
    PART_SIZE: 5000,      // จำนวนรายการต่อไฟล์ / Entries per file
    CACHE_LIMIT: 1000,    // ขีดจำกัดแคช / Cache limit
    CACHE_CHECK_INTERVAL: 30000,  // ตรวจสอบแคชทุก (มิลลิวินาที) / Cache check interval
    LOGGING: {
        ENABLED: true,          // เปิด/ปิดการบันทึกล็อก / Enable logging
        DEBUG: true,            // โหมดดีบัก / Debug mode
        FILE_LOGGING: true,     // บันทึกลงไฟล์ / File logging
        CONSOLE_LOGGING: true,  // แสดงในคอนโซล / Console logging
        LOG_FILE: 'msdb.log'    // ชื่อไฟล์ล็อก / Log filename
    }
};
```

## Contributing / การมีส่วนร่วม

We welcome contributions! / ยินดีต้อนรับการมีส่วนร่วมในการพัฒนา!

## License / ลิขสิทธิ์

MIT License
