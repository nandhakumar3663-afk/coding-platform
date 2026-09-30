import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../models/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { supabase, createUserScopedSupabaseClient, isSupabaseConfigured } from '../lib/supabase.js';
import { syncSupabaseUserToSqlite } from '../models/userSync.js';

export async function loginWithUsername(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (isSupabaseConfigured) {
    res.status(400).json({ error: 'Use your email address or Continue with Google.' });
    return;
  }

  const cleanUsername = username.trim();
  const user = queryOne<{ id: string; username: string; email: string; password_hash: string; role: string }>(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = ?',
    [cleanUsername]
  );

  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokenUser = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json({ user: tokenUser, token: generateToken(tokenUser) });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
    res.status(400).json({ error: 'Username must be 3-30 characters and alphanumeric or underscore.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { username: cleanUsername, full_name: cleanUsername },
      },
    });

    if (error || !data.user) {
      res.status(400).json({ error: error?.message || 'Unable to register user' });
      return;
    }

    res.status(201).json({
      user: {
        id: data.user.id,
        username: cleanUsername,
        email: cleanEmail,
        role: 'student',
      },
      token: data.session?.access_token || null,
      session: data.session,
      requiresEmailConfirmation: !data.session,
    });
    return;
  }

  const existingUser = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [cleanUsername, cleanEmail]);
  if (existingUser) {
    res.status(409).json({ error: 'Username or email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  execute(
    'INSERT INTO users (id, username, email, password_hash, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, cleanUsername, cleanEmail, passwordHash, 'student', 'email']
  );

  const user = { id: userId, username: cleanUsername, email: cleanEmail, role: 'student' };
  res.status(201).json({ user, token: generateToken(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const identifier = username.trim();

  if (isSupabaseConfigured) {
    if (!identifier.includes('@')) {
      res.status(400).json({ error: 'Use your email address or Continue with Google.' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.toLowerCase(),
      password,
    });

    if (error || !data.session || !data.user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const userClient = createUserScopedSupabaseClient(data.session.access_token);
    const { data: profile } = await userClient
      .from('profiles')
      .select('username, role, auth_provider')
      .eq('id', data.user.id)
      .single();

    const user = {
      id: data.user.id,
      username: profile?.username || data.user.email?.split('@')[0] || 'user',
      email: data.user.email || identifier,
      role: profile?.role === 'admin' ? 'admin' : 'student',
    };

    syncSupabaseUserToSqlite({
      ...user,
      auth_provider: profile?.auth_provider || 'email',
    });

    res.json({ user, token: data.session.access_token, session: data.session });
    return;
  }

  const user = queryOne<{ id: string; username: string; email: string; password_hash: string; role: string }>(
    'SELECT id, username, email, password_hash, role FROM users WHERE email = ? OR username = ?',
    [identifier, identifier]
  );

  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokenUser = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json({ user: tokenUser, token: generateToken(tokenUser) });
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

  res.json({ user: user || req.user });
}
