import { join } from "path"

import Database from "better-sqlite3"

const dbPath =
  process.env.DATABASE_PATH || join(__dirname, "../../data/database.sqlite")

export const db: Database.Database = new Database(dbPath, {
  verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
})

// Enable foreign keys
db.pragma("foreign_keys = ON")

export async function initDatabase() {
  console.log(`📂 Initializing database at: ${dbPath}`)

  // Create tables
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game sessions table
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER,
      player2_id INTEGER,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id INTEGER,
      game_type TEXT CHECK(game_type IN ('local', 'online', 'tournament')) NOT NULL,
      duration INTEGER, -- in seconds
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    -- Tournaments table
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- Tournament participants table
    CREATE TABLE IF NOT EXISTS tournament_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      alias TEXT NOT NULL,
      user_id INTEGER, -- NULL for local tournaments
      position INTEGER, -- Final ranking
      eliminated_at DATETIME,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Tournament matches table
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_order INTEGER NOT NULL,
      participant1_id INTEGER NOT NULL,
      participant2_id INTEGER NOT NULL,
      winner_id INTEGER,
      game_session_id INTEGER,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (participant1_id) REFERENCES tournament_participants(id),
      FOREIGN KEY (participant2_id) REFERENCES tournament_participants(id),
      FOREIGN KEY (winner_id) REFERENCES tournament_participants(id),
      FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
    );

    -- Indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_players ON game_sessions(player1_id, player2_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
  `

  // Execute schema
  db.exec(schema)

  console.log("✅ Database initialized successfully")
}

export default db
