# Deploying AlgoSphere to Vercel

This guide covers deploying the **Frontend to Vercel** and connecting it to the **Backend Judge**.

---

## Architecture Overview

- **Frontend (Vercel)**: Fast global edge CDN hosting React 18, Vite, Tailwind CSS, and Monaco Editor.
- **Backend (Render / Railway / Fly.io / VPS)**: Hosts the Express API, SQLite database, and the real GCC, G++, Java, and Python execution runners.

---

## Option 1: 1-Click Deploy Frontend on Vercel (Recommended)

### Step 1: Push to GitHub
Your code is already pushed to GitHub:
`https://github.com/nandhakumar3663-afk/coding-platform`

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Under **Import Git Repository**, select `coding-platform`.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or click Edit and select `frontend`)
   - **Build Command**: `npm --prefix frontend install && npm --prefix frontend run build` (or default if root is `frontend`)
   - **Output Directory**: `frontend/dist` (or `dist` if root is `frontend`)
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-domain.com` (leave empty for local proxy)
5. Click **Deploy**.

Vercel will build the frontend and provide your live production URL (e.g. `https://coding-platform-xyz.vercel.app`).

---

## Option 2: Deploy Frontend using Vercel CLI

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to Preview
vercel

# 4. Deploy to Production
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? Select your personal or team account
- Link to existing project? **No**
- What's your project's name? `coding-platform`
- In which directory is your code located? `./`
- Want to modify these settings? **No** (Vercel will use `vercel.json`)

---

## Deploying the Backend Judge (Free on Render / Railway)

Because the judge compiles real C, C++, and Java code using GCC, G++, and OpenJDK, it requires a Linux container.

### Option A: Render.com (Free)
1. Go to [render.com](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository: `nandhakumar3663-afk/coding-platform`.
3. Choose **Docker** as the Environment (it will automatically use the root `Dockerfile`).
4. Click **Create Web Service**.
5. Once deployed, copy your Render URL (e.g., `https://algo-judge.onrender.com`).
6. In your Vercel Dashboard, go to **Settings** ➜ **Environment Variables** and set:
   `VITE_API_URL` = `https://algo-judge.onrender.com`
7. Redeploy Vercel.

### Option B: Railway.app (Free)
1. Go to [railway.app](https://railway.app) ➜ **New Project** ➜ **Deploy from GitHub repo**.
2. Select `coding-platform`. Railway detects the `Dockerfile` and builds it.
3. Generate a domain under **Networking**.
4. Set `VITE_API_URL` in Vercel to your Railway domain.
