import { db, queryAll } from './models/db.js';

console.log('Database initialized successfully!');
const tables = queryAll("SELECT name FROM sqlite_master WHERE type='table'");
console.log('Tables created:', tables.map((t: any) => t.name));
