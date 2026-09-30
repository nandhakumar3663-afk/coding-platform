import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { supabase, createUserScopedSupabaseClient, isSupabaseConfigured } from '../lib/supabase.js';
import { syncSupabaseUserToSqlite } from '../models/userSync.js';
import { queryOne } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(48).toString('hex');

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Used for offline testing / backward-compatible session tokens.
 */
export function generateToken(user: { id: string; username: string; email: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Securely authenticates incoming requests using Supabase Auth access tokens,
 * with trusted server/database role resolution and safe local foreign-key synchronization.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next();
    return;
  }

  // 1. Primary Authentication: Secure Supabase verification
  if (isSupabaseConfigured) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        // Read the authenticated user's own trusted profile through RLS.
        const userClient = createUserScopedSupabaseClient(token);
        const { data: profile, error: profileError } = await userClient
          .from('profiles')
          .select('id, username, email, role, auth_provider')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Authenticated Supabase user has no trusted profile:', profileError?.message);
          next();
          return;
        }

        const role = profile.role === 'admin' ? 'admin' : 'student';
        const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        const email = user.email || profile?.email || '';

        // Synchronize canonical Supabase UUID to SQLite for existing foreign keys
        syncSupabaseUserToSqlite({
          id: user.id,
          username,
          email,
          role,
          auth_provider: profile?.auth_provider || 'supabase',
        });

        req.user = {
          id: user.id,
          username,
          email,
          role,
        };
        next();
        return;
      }
    } catch (err) {
      console.error('Supabase token verification failed:', err);
    }

    // When Supabase is configured, never accept legacy local JWTs.
    next();
    return;
  }

  // 2. Local-only fallback (used only when Supabase is not configured, e.g. offline tests)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id) {
      // Lookup trusted role from local database
      const dbUser = queryOne<{ id: string; username: string; email: string; role: string }>(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [decoded.id]
      );
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        };
      } else {
        req.user = {
          id: decoded.id,
          username: decoded.username || 'user',
          email: decoded.email || '',
          role: decoded.role || 'student',
        };
      }
    }
  } catch {
    // Invalid token, leave req.user undefined
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
