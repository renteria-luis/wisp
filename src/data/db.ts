/**
 * expo-sqlite database singleton + migration runner.
 *
 * Repositories call `getDb()`; the first call opens the database and applies any
 * outstanding migrations from `schema.ts`, tracked via `PRAGMA user_version`.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './schema';

const DB_NAME = 'wisp.db';

let instance: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (instance) return instance;
  if (!opening) {
    opening = (async () => {
      // Loaded lazily so merely importing the data layer never pulls the
      // native module (keeps web prerender and tests from touching SQLite).
      const SQLite = await import('expo-sqlite');
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      instance = db;
      return db;
    })();
  }
  return opening;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let version = row?.user_version ?? 0;

  for (let i = version; i < MIGRATIONS.length; i++) {
    const sql = MIGRATIONS[i];
    if (!sql) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    version = i + 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
