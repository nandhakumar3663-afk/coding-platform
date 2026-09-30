import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const DB_DIR = fileURLToPath(new URL('../../../database/', import.meta.url));
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.resolve(DB_DIR, 'platform.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema
const schemaPath = path.resolve(DB_DIR, 'schema/schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
} else {
  // Fallback direct execution
  const fallbackSchema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'student',
      auth_provider TEXT DEFAULT 'supabase',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      problem_number INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      constraints TEXT NOT NULL,
      input_format TEXT NOT NULL,
      output_format TEXT NOT NULL,
      starter_c TEXT NOT NULL,
      starter_cpp TEXT NOT NULL,
      starter_java TEXT NOT NULL,
      starter_python TEXT NOT NULL,
      reference_solution TEXT NOT NULL,
      reference_lang TEXT DEFAULT 'python',
      time_limit_ms INTEGER DEFAULT 2000,
      memory_limit_mb INTEGER DEFAULT 256,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS problem_examples (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      input TEXT NOT NULL,
      output TEXT NOT NULL,
      explanation TEXT,
      order_num INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      test_type TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 1,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS problem_tags (
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (problem_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      verdict TEXT NOT NULL,
      passed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      execution_time_ms INTEGER DEFAULT 0,
      memory_used_kb INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS submission_results (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      test_case_id TEXT,
      test_case_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      input_preview TEXT,
      expected_output TEXT,
      actual_output TEXT,
      execution_time_ms INTEGER DEFAULT 0,
      memory_used_kb INTEGER DEFAULT 0,
      error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      solved_at DATETIME,
      PRIMARY KEY (user_id, problem_id)
    );
  `;
  db.exec(fallbackSchema);
}

// Safely ensure auth_provider column exists on existing databases
try {
  db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'supabase';");
} catch {
  // column already exists
}

// Database helper functions
export const queryAll = <T = any>(sql: string, params: any[] = []): T[] => {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
};

export const queryOne = <T = any>(sql: string, params: any[] = []): T | undefined => {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
};

export const execute = (sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } => {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};
