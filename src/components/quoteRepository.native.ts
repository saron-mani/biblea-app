// Native quote lookup backed by a bundled SQLite database.
// The database lives in assets/data and is imported once into expo-sqlite's
// own directory using the SDK's supported asset import path, so the 13 MB
// JSON is never parsed into JS and we never write into SQLite's private dir
// through expo-file-system.
//
// The bundled .db is a build artifact of src/quoteBank.json. Its source hash
// is checked against the copy on the device so an updated JSON replaces the
// old database instead of being ignored.

import {
  importDatabaseFromAssetAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";
import { QUOTE_BANK_SOURCE_HASH } from "../quoteBank.meta";

const DB_NAME = "quoteBank.db";
const DB_ASSET = require("../../assets/data/quoteBank.db");

let dbPromise: Promise<SQLiteDatabase> | null = null;
let migrated = false;

async function readSourceHash(db: SQLiteDatabase): Promise<string | null> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM meta WHERE key = 'source_sha256'",
    );
    return row?.value ?? null;
  } catch {
    // Databases generated before the meta table existed.
    return null;
  }
}

async function openDatabase(): Promise<SQLiteDatabase> {
  // forceOverwrite defaults to false, so later launches reuse the copied DB.
  await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
  let db = await openDatabaseAsync(DB_NAME);

  // A JSON update produces a new bundled DB, but the copy already on the
  // device is still the old one. Replace it once, then keep reusing it.
  if ((await readSourceHash(db)) !== QUOTE_BANK_SOURCE_HASH) {
    await db.closeAsync();
    await importDatabaseFromAssetAsync(DB_NAME, {
      assetId: DB_ASSET,
      forceOverwrite: true,
    });
    db = await openDatabaseAsync(DB_NAME);

    const refreshedHash = await readSourceHash(db);
    if (refreshedHash !== QUOTE_BANK_SOURCE_HASH) {
      console.warn(
        "[biblea] quoteBank.db re-import did not apply " +
          `(expected ${QUOTE_BANK_SOURCE_HASH}, got ${refreshedHash})`,
      );
    } else {
      migrated = true;
      console.log("[biblea] quoteBank.db refreshed from current quoteBank.json");
    }
  }

  return db;
}

function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((error) => {
      dbPromise = null; // allow a retry after a transient failure
      throw error;
    });
  }
  return dbPromise;
}

/** Resolves once the database is ready; true if it was replaced this launch. */
export async function didMigrateQuoteBank(): Promise<boolean> {
  await getDatabase();
  return migrated;
}

export async function getVerse(
  book: string,
  chapter: string,
  verse: string,
): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ text: string }>(
    "SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ?",
    [String(book), String(chapter), String(verse)],
  );
  return row?.text ?? null;
}
