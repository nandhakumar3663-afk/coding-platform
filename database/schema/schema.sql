-- Database Schema for Online Coding Platform

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  problem_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
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
  test_type TEXT NOT NULL CHECK (test_type IN ('basic', 'valid', 'edge', 'large', 'special', 'random')),
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
  language TEXT NOT NULL CHECK (language IN ('c', 'cpp', 'java', 'python')),
  code TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Internal Error', 'Running')),
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
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'TLE', 'RTE', 'MLE')),
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
  status TEXT NOT NULL CHECK (status IN ('solved', 'attempted')),
  solved_at DATETIME,
  PRIMARY KEY (user_id, problem_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
