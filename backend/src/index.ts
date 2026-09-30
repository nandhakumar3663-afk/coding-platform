import express from 'express';
import { pathToFileURL } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import './models/db.js'; // Ensure DB initialized
import { queryOne } from './models/db.js';
import { seedDatabase } from './seed.js';

dotenv.config();

// Ensure the complete catalog is seeded automatically if DB is fresh or incomplete
const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM problems');
if (!countRow || Number(countRow.count) < 109) {
  console.log('📦 Auto-seeding database with complete 109 problem catalog...');
  try {
    await seedDatabase();
    console.log('✅ Database auto-seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to auto-seed database:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.startsWith('/api/health')) {
      console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) app.listen(PORT, () => {
  console.log(`🚀 Online Coding Platform Backend running on http://localhost:${PORT}`);
});

export default app;
