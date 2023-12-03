"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msdb_1 = __importDefault(require("./msdb"));
const myDatabase = (0, msdb_1.default)('myDatabase');
myDatabase.save('key1', 'value1');
myDatabase.save('key2', 'value2');
myDatabase.save('key3', 'value3');
console.log(myDatabase.find('key1'));
myDatabase.remove('key2');
console.log(myDatabase.random());
