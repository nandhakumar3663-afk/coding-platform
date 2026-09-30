# AlgoSphere — coding practice platform

React + Monaco frontend, Express + SQLite backend, and a native-code judge supporting C, C++, Java and Python.

## PDF exercise catalog

- **Level 2:** all 57 questions from `level 2 qp.pdf`.
- **Level 3:** all 52 questions from `ARRAYS LEVEL 3 with ans.pdf`.
- **109 problems, 776 tests, 667 hidden tests.** Each problem has a checked example, an input/output contract, constraints, a Python reference solution and at least five hidden cases.
- Use the topic filter to select **Level 2** or **Level 3**. Each description retains its PDF question number.
- See [the complete mapping and source corrections](docs/pdf-catalog.md). Some PDF answers contain inconsistent wording or unsafe C code; clarified behavior is displayed in the problem itself.

## Run locally

Prerequisites: Node.js **22.13+** (native `node:sqlite`), npm, Python 3, GCC, G++, and a **JDK** providing both `javac` and `java` on PATH. A JRE alone cannot compile Java submissions.

```bash
cd backend
npm install
npm run seed
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend proxies `/api` to port 4000.

For compiled backend execution:

```bash
cd backend
npm run build
npm start
```

## Login

| Username | Password | Role |
|---|---|---|
| user | 123 | Student |
| admin | 3663 | Administrator |

Sign in through `/login`. There is no automatic login or one-click role switching. Admin routes require an admin token on the backend as well as the frontend. Logging out removes the stored token. Registration, if used through the existing API, always creates a student.

Running `npm run seed` deliberately restores these two default accounts and their passwords, including on an existing database. Passwords are bcrypt-hashed. Set a private `JWT_SECRET` in `backend/.env` to preserve sessions across server restarts; otherwise the server creates a random process-local signing key. Never commit `.env`.

## Editor and judge

The editor starts **empty** when opening a question, changing languages, or pressing Reset. No starter code or old local-storage drafts are inserted. Write a full stdin/stdout program; Java programs should use `Main`. Empty submissions are rejected.

- **Run:** execute visible sample cases, or execute custom input without judging it against an empty expected answer.
- **Submit:** execute all visible and hidden cases and update your progress.
- Hidden inputs, expected outputs, actual outputs and stderr are masked in submission responses and history. Students cannot open another student's submission. Admins can inspect and regenerate tests through the admin panel.
- Whitespace at line ends is ignored; meaningful line breaks and output tokens are checked.

## Catalog maintenance and verification

```bash
# From repository root: rebuild deterministic catalog and verify 109 anchor examples
python3 scripts/build_catalog.py

# Build and exercise every reference through the real Python judge,
# plus API login/authorization, hidden-data masking, reseeding, C/C++, CE and TLE
npm test --prefix backend
npm run build --prefix frontend
```

The test suite uses a temporary database, not your practice database. Seeding updates catalog rows in place, preserving problem IDs, submissions and progress. The old Reverse problem moves from platform #12 to #49. Custom questions are retained and moved above #109 if their numbers conflict. Reference and test files are backend-only; Vite never imports them.

Admin regeneration for PDF questions uses their curated inputs rather than the legacy generic input fallback. Admin-created questions continue to use the original generator.

## Deployment boundary

This repository's existing judge runs programs as native child processes on the backend host. Temporary directories and timeouts are **not a security sandbox**. Memory usage is not measured (reported as zero), and the advertised memory limit is not generally enforced. Use this setup for trusted local/classroom practice; untrusted public execution requires an isolated judge service with filesystem, network, process and resource restrictions.

Hidden means hidden from the student UI/API. Test definitions and reference solutions are visible to anyone with repository access, and native submissions are not isolated from host files. These limitations must be addressed before promising secret tests on a public deployment. The requested default passwords are intended for the demo setup.
