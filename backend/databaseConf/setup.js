import { openDatabase } from "./connection.js";

const db = openDatabase();

try {
  db.exec(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS reading_lists (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS books (
      id      INTEGER PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES reading_lists(id),
      title   TEXT NOT NULL,
      author  TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1))
    ) STRICT;

    CREATE TABLE IF NOT EXISTS video_progress (
      video_id         TEXT PRIMARY KEY,
      position_seconds REAL NOT NULL DEFAULT 0 CHECK (position_seconds >= 0)
    ) STRICT;

    COMMIT;
  `);

  console.log("Database tables are ready.");
} finally {
  db.close();
}