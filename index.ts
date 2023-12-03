import { table } from 'console';
import initializeDatabase from './msdb'; //สร้างตัวเชื่อมต่อ Json Manager รุ่นไม่มีระบบ Table Sql

const myDatabase = initializeDatabase('myDatabase'); //ชื่อ Datavase

myDatabase.save('key1', 'value1');   //table ของแต่ละค่า เก็บข้อมูลเป็น json Number String bool หรืออะไรก้ได้
myDatabase.save('key2', 'value2');  //table ของแต่ละค่า เก็บข้อมูลเป็น json Number String bool หรืออะไรก้ได้
myDatabase.save('key3', 'value3');  //table ของแต่ละค่า เก็บข้อมูลเป็น json Number String bool หรืออะไรก้ได้

console.log(myDatabase.find('key1')); //ทำการดึงค่า Table key1

myDatabase.remove('key2'); //ทำการลบ Table key2

console.log(myDatabase.random()); //สุ่ม Table ออกมา
