import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase() {
  const configuredPath = process.env.DATABASE_PATH;

  if (!configuredPath) {
    throw new Error("Set DATABASE_PATH in backend/.env before opening the database.");
  }

  const databasePath = resolve(import.meta.dirname, "..", configuredPath);
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}