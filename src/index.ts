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