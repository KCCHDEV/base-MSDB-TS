# 🗄️ base-MSDB-TS (MSDBTS V18)

[English](#english-documentation) | [ภาษาไทย](#thai-documentation)

## Latest Updates (V18)
- Enhanced file management with 2500 entries per file limit
- Improved caching system with memory optimization
- Added queue-based save operations
- Better error handling and recovery
- File-based data partitioning

## Key Features
- Type-safe database operations
- Automatic file partitioning (2500 entries per file)
- In-memory caching with disk persistence
- Batch operations support
- Async/await API
- Comprehensive error handling
- Built-in retry mechanism
- Memory usage optimization

## Quick Start
```typescript
import initializeDatabase from 'base-msdb-ts';

interface User {
    name: string;
    age: number;
}

const db = initializeDatabase('myDatabase');
const users = db<User>('users');

// Save data
await users.save('user1', { name: 'John', age: 30 });

// Query data
const user = await users.find('user1');
const allUsers = users.getAll();
const youngUsers = users.getWhere({ age: 25 });
```

## Configuration
```typescript
const CONFIG = {
    FILE_SETTINGS: {
        MAX_ENTRIES_PER_FILE: 2500,  // Entries per file
        FILE_PREFIX: 'data',         // File prefix
        MAX_FILES: 1000,             // Maximum number of files
    },
    CACHE: {
        SIZE: 100,                   // Cache size in entries
        LIMIT_MB: 100,              // Cache limit in MB
        CHECK_INTERVAL: 5000,        // Cache check interval (ms)
        SAVE_INTERVAL: 1000         // Save interval (ms)
    }
};
```

## Performance Tips
1. Batch Operations:
```typescript
const batchSave = async (users: User[]) => {
    for (const user of users) {
        await users.save(generateId(), user);
    }
};
```

2. Error Handling:
```typescript
try {
    await users.save('user1', data);
} catch (error) {
    if (error instanceof DatabaseError) {
        // Handle database errors
    }
}
```

3. Memory Management:
```typescript
users.config.setCacheLimit(1000);     // Set cache limit
users.config.setCacheSizeMB(100);     // Set memory limit
```

## Best Practices
1. Use proper types for data structures
2. Implement error handling
3. Use batch operations for multiple saves
4. Monitor memory usage
5. Configure cache based on your needs

## API Reference
- `save(id: string, data: T)`: Save data
- `find(id: string)`: Find by ID
- `getAll(orderBy?: 'asc' | 'desc')`: Get all entries
- `getWhere(condition: Partial<T>)`: Query with condition
- `remove(id: string)`: Remove entry
- `random()`: Get random entry

# English Documentation

## Advanced Usage Examples

### 1. Auto-Create Data if Not Found
```typescript
interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

const db = initializeDatabase('shop');
const products = db<Product>('products');

async function getOrCreateProduct(id: string, defaultData?: Partial<Product>): Promise<Product> {
    const existing = await products.find(id);
    if (existing) return existing.value;

    const newProduct = {
        id,
        name: defaultData?.name || 'New Product',
        price: defaultData?.price || 0,
        stock: defaultData?.stock || 0
    };

    await products.save(id, newProduct);
    return newProduct;
}

// Usage
const product = await getOrCreateProduct('apple', { name: 'Apple', price: 0.5 });
```

### 2. Batch Processing with Progress
```typescript
async function batchProcess<T>(items: T[], batchSize = 50) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(item => products.save(item.id, item));
        await Promise.all(promises);
        console.log(`Processed ${i + batch.length}/${items.length}`);
    }
}
```

### 3. Search with Multiple Conditions
```typescript
interface SearchParams {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
}

function searchProducts(params: SearchParams) {
    return products.getAll().filter(product => {
        if (params.minPrice && product.value.price < params.minPrice) return false;
        if (params.maxPrice && product.value.price > params.maxPrice) return false;
        if (params.inStock && product.value.stock <= 0) return false;
        return true;
    });
}
```

### 4. Auto-Incrementing IDs
```typescript
async function getNextId(prefix: string): Promise<string> {
    const all = products.getAll();
    const existing = all
        .map(e => e.id)
        .filter(id => id.startsWith(prefix))
        .map(id => parseInt(id.replace(prefix, '')));
    
    const nextNum = Math.max(0, ...existing) + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
}

// Usage
const newId = await getNextId('PROD');  // Returns: PROD000001
```

# ภาษาไทย

## ตัวอย่างการใช้งานขั้นสูง

### 1. ระบบสร้างข้อมูลอัตโนมัติเมื่อไม่พบข้อมูล
```typescript
// ตัวอย่างการสร้างข้อมูลสินค้าอัตโนมัติ
interface Product {
    id: string;
    name: string;    // ชื่อสินค้า
    price: number;   // ราคา
    stock: number;   // จำนวนในสต็อก
}

const db = initializeDatabase('shop');
const products = db<Product>('products');

// ฟังก์ชันสำหรับค้นหาหรือสร้างสินค้าใหม่
async function getOrCreateProduct(id: string, defaults?: Partial<Product>): Promise<Product> {
    const existing = await products.find(id);
    if (existing) return existing.value;

    // สร้างสินค้าใหม่ถ้าไม่พบ
    const newProduct = {
        id,
        name: defaults?.name || 'New Product',
        price: defaults?.price || 0,
        stock: defaults?.stock || 0
    };

    await products.save(id, newProduct);
    return newProduct;
}

// ตัวอย่างการใช้งาน
const product = await getOrCreateProduct('apple', { 
    name: 'Apple', 
    price: 20,
    stock: 100 
});
```

### 2. การประมวลผลแบบชุดพร้อมแสดงความคืบหน้า
```typescript
// ฟังก์ชันสำหรับบันทึกข้อมูลเป็นชุด
async function processBatch<T>(items: T[], batchSize = 50) {
    // แสดงความคืบหน้าการทำงาน
    const total = items.length;
    let processed = 0;

    // แบ่งการทำงานเป็นชุด
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // บันทึกข้อมูลพร้อมกัน
        await Promise.all(
            batch.map(item => products.save(item.id, item))
        );

        // อัพเดทและแสดงความคืบหน้า
        processed += batch.length;
        console.log(`ดำเนินการแล้ว: ${processed}/${total}`);
    }
}
```

### 3. การค้นหาด้วยเงื่อนไขหลายอย่าง
```typescript
// กำหนดเงื่อนไขการค้นหา
interface SearchCriteria {
    minPrice?: number;   // ราคาต่ำสุด
    maxPrice?: number;   // ราคาสูงสุด
    inStock?: boolean;   // มีในสต็อก
}

// ฟังก์ชันค้นหาสินค้า
function searchProducts(criteria: SearchCriteria) {
    return products.getAll().filter(product => {
        // ตรวจสอบเงื่อนไขทั้งหมด
        if (criteria.minPrice && product.value.price < criteria.minPrice) return false;
        if (criteria.maxPrice && product.value.price > criteria.maxPrice) return false;
        if (criteria.inStock && product.value.stock <= 0) return false;
        return true;
    });
}

// ตัวอย่างการใช้งาน
const results = searchProducts({
    minPrice: 10,
    maxPrice: 100,
    inStock: true
});
```

### 4. ระบบสร้างรหัสอัตโนมัติ
```typescript
// ฟังก์ชันสร้างรหัสถัดไป
async function generateNextId(prefix: string): Promise<string> {
    const all = products.getAll();
    
    // หารหัสล่าสุด
    const lastId = all
        .map(e => e.id)
        .filter(id => id.startsWith(prefix))
        .map(id => parseInt(id.replace(prefix, '')))
        .reduce((max, curr) => Math.max(max, curr), 0);

    // สร้างรหัสใหม่
    const nextNum = lastId + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
}

// ตัวอย่างการใช้งาน
const newId = await generateNextId('PROD');  // จะได้: PROD000001
```

## Contributing
Issues and PRs welcome!

## License
MIT License
