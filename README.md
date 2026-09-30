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

## Deploy to Vercel

### 1-Click Deploy (Frontend)
1. Go to [vercel.com/new](https://vercel.com/new) and import `nandhakumar3663-afk/coding-platform`.
2. Vercel automatically detects the configuration from `vercel.json`.
3. In **Environment Variables**, optionally set:
   - `VITE_API_URL` = `https://your-backend-api.onrender.com` (your deployed backend URL)
4. Click **Deploy**.

For detailed setup, Docker deployment, and connecting to the backend judge, see [docs/deploy-vercel.md](docs/deploy-vercel.md).


## Supabase & Google Authentication Setup

AlgoSphere uses **Supabase Auth** and **Supabase PostgreSQL** for cloud authentication, supporting:
- Email/password registration (`/register`) with strict validation
- Email or Username login (`/login`)
- "Continue with Google" OAuth sign-in (`/auth/callback`)
- Secure password recovery (`/forgot-password` and `/reset-password`)
- Persistent sessions across browser refreshes
- Student and Administrator role enforcement via PostgreSQL Row Level Security (RLS)

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Note your project's **Project URL**, **anon/public API key**, and **service_role secret key** (found in Project Settings -> API).

### 2. Run Database Migration
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Open and run the contents of [`database/supabase-auth.sql`](database/supabase-auth.sql).
3. This creates:
   - The `profiles` table referencing `auth.users(id)`
   - Row Level Security (RLS) policies allowing users to view and update their own profiles
   - Security triggers preventing client-side role escalation (every new account is strictly created with `role = 'student'`)
   - Automatic profile generation triggers for both Email and Google OAuth signups (including collision-safe username generation)

### 3. Enable Supabase Authentication Providers
1. In Supabase Dashboard, navigate to **Authentication** -> **Providers**.
2. **Email Provider:**
   - Ensure **Email** is enabled.
   - Configure email confirmations according to your preference (enabled by default).
3. **Google Provider:**
   - Enable the **Google** provider.
   - Keep this tab open; you will paste your Google **Client ID** and **Client Secret** here in step 4.
   - Note the **Callback URL (for OAuth)** shown by Supabase (typically `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`).

### 4. Create & Configure Google Cloud OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Google Cloud Project (or select an existing one).
3. Configure the **OAuth consent screen**:
   - User Type: **External**
   - App Name: `AlgoSphere Judge` (or your app name)
   - User support email and developer contact email: your email
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. Create OAuth Credentials:
   - Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `AlgoSphere Web Client`.
   - **Authorized redirect URIs**: Add the exact Callback URL from Supabase (e.g. `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`).
5. Copy your **Client ID** and **Client Secret**, return to your Supabase Dashboard under **Authentication -> Providers -> Google**, paste them, and click **Save**.

### 5. Configure Supabase Redirect URLs
In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**:
1. **Site URL:** Set to `http://localhost:5173` (for local development) or your production domain (e.g. `https://<YOUR-APP>.vercel.app`).
2. **Redirect URLs:** Add both:
   - `http://localhost:5173/**`
   - `https://<YOUR-APP>.vercel.app/**`

### 6. Environment Variables Configuration

#### Frontend (`frontend/.env`)
Create `frontend/.env` (see [`frontend/.env.example`](frontend/.env.example)):
```env
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR-SUPABASE-ANON-KEY>
```
> **Security Warning:** Never expose the service role key to the frontend. Only use `VITE_SUPABASE_ANON_KEY`.

#### Backend (`backend/.env`)
Create `backend/.env` (see [`backend/.env.example`](backend/.env.example)):
```env
PORT=4000
SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
SUPABASE_ANON_KEY=<YOUR-SUPABASE-ANON-KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR-SUPABASE-SERVICE-ROLE-KEY>
JWT_SECRET=<RANDOM-32-CHAR-SECRET>
```

#### Vercel Environment Variables
In your Vercel Project Dashboard (Settings -> Environment Variables):
- `VITE_API_URL`: Your backend API URL (e.g. `https://<YOUR-BACKEND>.onrender.com`)
- `VITE_SUPABASE_URL`: `https://<YOUR-PROJECT-REF>.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `<YOUR-SUPABASE-ANON-KEY>`

### 7. Promoting an Account to Administrator
All new accounts are strictly assigned the `student` role by database trigger. To promote an account to administrator, execute the following SQL in your Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';
```
*(Replace `YOUR_EMAIL@EXAMPLE.COM` with your registered email address).*

Admin accounts gain access to `/admin` (problem authoring, test case management, and test regeneration). Unauthorized users are redirected away.

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
