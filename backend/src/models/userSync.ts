import { execute, queryOne } from './db.js';

export interface SyncedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  auth_provider?: string;
}

/**
 * Ensures the authenticated Supabase user exists in the local SQLite database
 * so that foreign-key constraints on submissions and user_progress succeed seamlessly.
 */
export function syncSupabaseUserToSqlite(user: SyncedUser): void {
  try {
    const existing = queryOne<{ id: string; role: string; username: string }>(
      'SELECT id, role, username FROM users WHERE id = ?',
      [user.id]
    );

    if (existing) {
      execute(
        'UPDATE users SET username = ?, email = ?, role = ?, auth_provider = ? WHERE id = ?',
        [user.username, user.email, user.role, user.auth_provider || 'supabase', user.id]
      );
    } else {
      let safeUsername = user.username;
      const collision = queryOne<{ id: string }>(
        'SELECT id FROM users WHERE username = ?',
        [safeUsername]
      );
      if (collision && collision.id !== user.id) {
        safeUsername = `${user.username}_${user.id.slice(0, 6)}`;
      }

      execute(
        'INSERT INTO users (id, username, email, password_hash, role, auth_provider) VALUES (?, ?, ?, NULL, ?, ?)',
        [user.id, safeUsername, user.email, user.role, user.auth_provider || 'supabase']
      );
    }
  } catch (err) {
    console.error('Failed to sync Supabase user to SQLite database:', err);
  }
}
