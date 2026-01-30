import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'luxefinds.db');

// Ensure the data directory exists
import { mkdirSync } from 'fs';
const dbDir = path.dirname(dbPath);
try {
  mkdirSync(dbDir, { recursive: true });
} catch (e) {
  // Directory might already exist
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export default db;
