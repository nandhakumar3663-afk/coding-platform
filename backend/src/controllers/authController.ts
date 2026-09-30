import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../models/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  const existingUser = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existingUser) {
    res.status(409).json({ error: 'Username or email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  execute(
    'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [userId, username, email, passwordHash, 'student']
  );

  const user = { id: userId, username, email, role: 'student' };
  const token = generateToken(user);

  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Username/email and password are required' });
    return;
  }

  const user = queryOne(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?',
    [username, username]
  );

  if (!user) {
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

  const user = queryOne('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
}
