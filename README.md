# AlgoSphere — Online Coding & Judge Platform

A full-stack, production-style online coding platform similar to LeetCode/HackerRank.  
Students can browse problems, write code in an online Monaco editor, select from 4 languages, run against sample tests, and submit for automated judging against hidden test cases — with real compilation and execution.

---

## Architecture

```
coding-platform/
├── frontend/          React + Vite + TypeScript + Tailwind + Monaco Editor
├── backend/           Express.js + TypeScript + SQLite (Node 22 native)
├── database/          Schema and seed data
│   ├── schema/        SQL schema definitions
│   └── seeds/         (seed data applied via backend/src/seed.ts)
└── runner/            Language runners & Dockerfiles (future containerization)
```

### Execution Flow

```
User writes code → Select language → Click Submit
       ↓
  Backend receives code
       ↓
  Compile (gcc/g++/javac) or syntax-check (python)
       ↓
  Run against all 5 hidden test cases
       ↓
  Compare stdout with trusted expected output
       ↓
  Return verdict: Accepted / Wrong Answer / CE / RE / TLE
```

### Test Case Generation

Every problem has a trusted Python reference solution. Test cases are generated automatically:

1. **Generate** structured inputs (basic, valid, edge, large, special)
2. **Execute** the reference solution on each input
3. **Capture** the output as the expected answer
4. **Store** input + expected output in the database
5. **Verify** the reference solution passes all generated cases

---

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 18, Vite 6, TypeScript, Tailwind CSS 3 |
| Editor     | Monaco Editor (@monaco-editor/react)         |
| Backend    | Node.js 22, Express.js, TypeScript            |
| Database   | SQLite (Node 22 native `node:sqlite`)         |
| Auth       | JWT (jsonwebtoken) + bcryptjs                 |
| Compilers  | GCC 16, G++ 16, OpenJDK 25, Python 3.14     |
| Toolchain  | micromamba (conda-forge)                      |

---

## Installation

### Prerequisites

- Node.js >= 22
- Python 3
- Internet connection (for micromamba compiler install)

### 1. Install compilers via micromamba (automated during initial setup)

```bash
# Already installed at /home/nandha/tools/env/bin/
# Contains: gcc, g++, javac, java
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Initialize database and seed 12 problems with auto-generated test cases

```bash
cd backend
npm run seed
```

### 4. Start backend server (port 4000)

```bash
cd backend
npm run dev
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Start frontend dev server (port 5173)

```bash
cd frontend
npm run dev
```

### 7. Open in browser

```
http://localhost:5173
```

---

## Demo Accounts

| Username | Password     | Role    |
|----------|-------------|---------|
| student  | student123  | Student |
| admin    | admin123    | Admin   |

The UI includes a quick role-switcher in the navbar.

---

## Database Schema

Tables: `users`, `problems`, `problem_examples`, `test_cases`, `tags`, `problem_tags`, `submissions`, `submission_results`, `user_progress`

All schema is defined in `database/schema/schema.sql`.

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Problems
- `GET /api/problems` — List all problems (supports `?difficulty=&tag=&status=&search=`)
- `GET /api/problems/:slug` — Get problem details
- `POST /api/problems/:slug/run` — Run code against sample tests
- `POST /api/problems/:slug/submit` — Submit code against all tests

### Submissions
- `GET /api/submissions` — List submissions
- `GET /api/submissions/:id` — Get submission details

### User
- `GET /api/user/progress` — Dashboard stats

### Admin
- `GET /api/admin/problems` — List all problems with stats
- `POST /api/admin/problems` — Create problem
- `PUT /api/admin/problems/:id` — Update problem
- `DELETE /api/admin/problems/:id` — Delete problem
- `POST /api/admin/problems/:id/generate-tests` — Regenerate test cases
- `GET /api/admin/problems/:id/test-cases` — View test cases
- `PATCH /api/admin/test-cases/:testCaseId/toggle` — Toggle visibility
- `GET /api/admin/stats` — System statistics

---

## Supported Languages

| Language | Compile Command                    | Execute Command   |
|----------|-----------------------------------|--------------------|
| C        | `gcc solution.c -O2 -o solution -lm` | `./solution`    |
| C++      | `g++ solution.cpp -O2 -std=c++17 -o solution` | `./solution` |
| Java     | `javac Main.java`                 | `java Main`        |
| Python   | `python3 -m py_compile solution.py` (syntax) | `python3 solution.py` |

---

## Adding New Problems

### Via Admin Panel

1. Switch to Admin view in the navbar
2. Problems are managed from the Admin Panel page

### Via Seed Script

Add problem definitions to `backend/src/seed.ts` with:
- Title, slug, description, constraints
- Starter code for all 4 languages
- Reference solution (Python)
- Tags and difficulty

Run `npm run seed` to generate test cases automatically.

---

## Security Considerations

- Passwords are hashed with bcryptjs (10 rounds)
- JWT tokens expire in 7 days
- Reference solutions are never exposed to students via API
- Hidden test cases show only "[Hidden]" to prevent cheating
- Code execution has timeouts (2.5s default) to prevent infinite loops
- Each submission runs in an isolated temp directory that is cleaned up

---

## Verdict Types

| Verdict              | Description                                     |
|---------------------|-------------------------------------------------|
| Accepted            | All test cases passed                            |
| Wrong Answer        | Output doesn't match expected                   |
| Compilation Error   | Code failed to compile                           |
| Runtime Error       | Program crashed during execution                 |
| Time Limit Exceeded | Program exceeded the time limit                  |
| Memory Limit Exceeded | Program exceeded memory limit                  |

---

## Sample Problems (12 seeded)

1. Fibonacci Series (Easy)
2. Smallest 5 Primes Greater Than N (Easy)
3. Prime or Composite Number (Easy)
4. Series Sum Calculator (Medium)
5. Divisor Sum and Equality Checker (Medium)
6. Abundant Number (Easy)
7. Count Leap and Non-Leap Years (Medium)
8. Geometric Series Sum Calculator (Easy)
9. Sum of Squares of N Natural Numbers (Easy)
10. Harmonic Series Sum (Easy)
11. Digits Count (Easy)
12. Reverse the Digits (Easy)

Each problem has 5 auto-generated test cases verified against the trusted reference solution.
