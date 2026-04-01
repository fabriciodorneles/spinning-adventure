import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "spinning.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at    TEXT NOT NULL,
      ended_at      TEXT NOT NULL,
      duration_sec  INTEGER NOT NULL,
      avg_speed     REAL,
      avg_power     REAL,
      avg_cadence   REAL,
      max_speed     REAL,
      max_power     REAL,
      work_j        REAL,
      samples       TEXT
    );
  `);

  // Migração: adiciona work_j se a tabela já existia sem a coluna
  try {
    _db.exec(`ALTER TABLE workouts ADD COLUMN work_j REAL`);
  } catch {
    // coluna já existe — ignorar
  }

  return _db;
}
