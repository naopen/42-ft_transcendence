import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../data/transcendence.db');

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export async function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      locale TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER,
      player2_id INTEGER,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id INTEGER,
      game_mode TEXT DEFAULT 'classic',
      duration INTEGER,
      status TEXT DEFAULT 'pending',
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  // Tournament games (for local tournaments with aliases)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      player1_alias TEXT NOT NULL,
      player2_alias TEXT NOT NULL,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_alias TEXT,
      status TEXT DEFAULT 'pending',
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    )
  `);

  // Tournaments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_players INTEGER NOT NULL,
      current_round INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      winner_alias TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    )
  `);

  // Tournament players
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      alias TEXT NOT NULL,
      user_id INTEGER,
      position INTEGER,
      eliminated_round INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(tournament_id, alias)
    )
  `);

  // User statistics
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      games_lost INTEGER DEFAULT 0,
      total_points_scored INTEGER DEFAULT 0,
      total_points_conceded INTEGER DEFAULT 0,
      win_streak INTEGER DEFAULT 0,
      best_win_streak INTEGER DEFAULT 0,
      avg_game_duration INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
    CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_tournament_games_tournament ON tournament_games(tournament_id);
  `);

  console.log('✅ Database initialized successfully');
}

// Helper function to hash passwords (for future use if needed)
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export default db;
