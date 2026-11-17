// Builds assets/data/quoteBank.db from src/quoteBank.json.
// Run with: node scripts/build-quote-db.mjs
// The generated .db is committed so EAS builds don't need this script.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src/quoteBank.json");
const out = resolve(root, "assets/data/quoteBank.db");

const bank = JSON.parse(readFileSync(source, "utf8"));
mkdirSync(dirname(out), { recursive: true });
rmSync(out, { force: true });

const db = new DatabaseSync(out);
db.exec(`
  PRAGMA journal_mode = DELETE;
  CREATE TABLE verses (
    id INTEGER PRIMARY KEY,
    book TEXT NOT NULL,
    chapter TEXT NOT NULL,
    verse TEXT NOT NULL,
    text TEXT NOT NULL,
    UNIQUE (book, chapter, verse)
  );
`);

const insert = db.prepare(
  "INSERT INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)",
);

let count = 0;
db.exec("BEGIN");
for (const [book, chapters] of Object.entries(bank)) {
  for (const [chapter, verses] of Object.entries(chapters)) {
    for (const [verse, text] of Object.entries(verses)) {
      insert.run(book, chapter, verse, text);
      count += 1;
    }
  }
}
db.exec("COMMIT");
db.close();

console.log(`Wrote ${count} verses to ${out}`);
