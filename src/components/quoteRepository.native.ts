// Native quote lookup backed by a bundled SQLite database.
// The database lives in assets/data and is imported once into expo-sqlite's
// own directory using the SDK's supported asset import path, so the 11.5 MB
// JSON is never parsed into JS and we never write into SQLite's private dir
// through expo-file-system.

import {
  importDatabaseFromAssetAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";

const DB_NAME = "quoteBank.db";
const DB_ASSET = require("../../assets/data/quoteBank.db");

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLiteDatabase> {
  // forceOverwrite defaults to false, so later launches reuse the copied DB.
  await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
  return openDatabaseAsync(DB_NAME);
}

function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
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
