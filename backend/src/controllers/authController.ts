import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../models/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { syncSupabaseUserToSqlite } from '../models/userSync.js';

/**
 * Securely logs in a user using their username instead of email.
 * Resolves the username to its email using the privileged Supabase Admin client,
 * then authenticates with Supabase, returning the session.
 * Never reveals whether a username or email exists.
 */
export async function loginWithUsername(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUsername = username.trim();

  // 1. Supabase Flow
  if (isSupabaseConfigured) {
    try {
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, username, role, auth_provider')
        .ilike('username', cleanUsername)
        .single();

      if (profileErr || !profile || !profile.email) {
        // Generic error to avoid username enumeration
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Authenticate via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (authError || !data.session || !data.user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Sync user to SQLite for local foreign keys
      syncSupabaseUserToSqlite({
        id: data.user.id,
        username: profile.username,
        email: profile.email,
        role: profile.role || 'student',
        auth_provider: profile.auth_provider || 'email',
      });

      res.json({
        session: data.session,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          username: profile.username,
          email: profile.email,
          role: profile.role || 'student',
        },
      });
      return;
    } catch (err) {
      console.error('loginWithUsername error:', err);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  }

  // 2. Offline / Local fallback for test suite
  const user = queryOne<{ id: string; username: string; email: string; password_hash: string; role: string }>(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = ?',
    [cleanUsername]
  );

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokenUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(tokenUser);
  res.json({ user: tokenUser, token });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Basic validation
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
    res.status(400).json({ error: 'Username must be 3-30 characters and alphanumeric or underscore.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  // Check local database for duplicates
  const existingUser = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [cleanUsername, cleanEmail]);
  if (existingUser) {
    res.status(409).json({ error: 'Username or email already in use' });
    return;
  }

  // If Supabase is configured, create via Supabase Admin
  if (isSupabaseConfigured) {
    try {
      const { data, error: signupErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: cleanUsername,
        },
      });

      if (signupErr || !data.user) {
        res.status(400).json({ error: signupErr?.message || 'Unable to register user' });
        return;
      }

      // Check profile or create
      const userId = data.user.id;
      syncSupabaseUserToSqlite({
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        role: 'student',
        auth_provider: 'email',
      });

      const user = { id: userId, username: cleanUsername, email: cleanEmail, role: 'student' };
      const token = generateToken(user);
      res.status(201).json({ user, token });
      return;
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
      return;
    }
  }

  // Local fallback for test suite
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  execute(
    'INSERT INTO users (id, username, email, password_hash, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, cleanUsername, cleanEmail, passwordHash, 'student', 'email']
  );

  const user = { id: userId, username: cleanUsername, email: cleanEmail, role: 'student' };
  const token = generateToken(user);

  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username/email and password are required' });
    return;
  }

  const identifier = username.trim();

  // If identifier is not an email, redirect to username login logic
  if (!identifier.includes('@')) {
    return loginWithUsername(req, res);
  }

  // Email login
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.toLowerCase(),
        password,
      });

      if (error || !data.session || !data.user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username, role')
        .eq('id', data.user.id)
        .single();

      const user = {
        id: data.user.id,
        username: profile?.username || data.user.email?.split('@')[0] || 'user',
        email: data.user.email || identifier,
        role: profile?.role || 'student',
      };

      syncSupabaseUserToSqlite({
        ...user,
        auth_provider: 'email',
      });

      res.json({ user, token: data.session.access_token, session: data.session });
      return;
    } catch {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  }

  // Local fallback for test suite
  const user = queryOne<{ id: string; username: string; email: string; password_hash: string; role: string }>(
    'SELECT id, username, email, password_hash, role FROM users WHERE email = ? OR username = ?',
    [identifier, identifier]
  );

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokenUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(tokenUser);
  res.json({ user: tokenUser, token });
}

export function getCurrentUser(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = queryOne(
    'SELECT id, username, email, role, auth_provider, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) {
    res.json({ user: req.user });
    return;
  }

  res.json({ user });
}
