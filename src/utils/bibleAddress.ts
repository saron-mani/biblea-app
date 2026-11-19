// src/utils/bibleAddress.ts
//
// Converts human-readable Bible references into the numeric address-bank key
// used by quoteBank.json / quoteAddress.json: "ulpathi 1:1" -> "0:1:1".
// Malayalam names come from the shared book list; romanized and English names
// are kept here so the converter also works from a plain keyboard.

import { malayalamBooks } from "../malayalamBooks";

// Index 0 has no numeric prefix; numbered books use ordinal 1/2/3.
const ORDINALS: Record<number, number> = {
  8: 1, 9: 2,
  10: 1, 11: 2,
  12: 1, 13: 2,
  45: 1, 46: 2,
  51: 1, 52: 2,
  53: 1, 54: 2,
  59: 1, 60: 2,
  61: 1, 62: 2, 63: 3,
  71: 1, 72: 2,
};

const WORD_ORDINALS: Record<number, string> = {
  1: "first",
  2: "second",
  3: "third",
};

// Common keyboard spellings for each book. The Malayalam name from
// malayalamBooks.ts is added automatically below.
const BOOK_ALIASES: string[][] = [
  ["ulpathi", "ulpathi", "ulpatthi", "uppathi", "genesis", "gen"],
  ["purappadu", "purapattu", "purappattu", "exodus", "exo"],
  ["levyir", "leviyar", "leviticus", "lev"],
  ["sankhya", "sankya", "numbers", "num"],
  ["niyamavarthanam", "niyamavarththanam", "deuteronomy", "deut"],
  ["joshua", "joshuwa", "yoshua"],
  ["nyayadhippanmar", "nyayadhipanmar", "judges", "judg"],
  ["ruth", "ruthu"],
  ["samuel", "samuvel", "sam"],
  ["samuel", "samuvel", "sam"],
  ["rajakkanmar", "rajakkanmar", "kings", "king"],
  ["rajakkanmar", "rajakkanmar", "kings", "king"],
  ["dinavrittantham", "dinavrittam", "chronicles", "chron"],
  ["dinavrittantham", "dinavrittam", "chronicles", "chron"],
  ["esra", "ezra"],
  ["nehemiya", "nehemiah", "neh"],
  ["esther", "esth"],
  ["job", "iyobu"],
  ["sankirthanangal", "sangithangal", "psalms", "psalm", "ps"],
  ["subhashithangal", "subhashitham", "proverbs", "prov"],
  ["sabhaprasangakan", "ecclesiastes", "eccles"],
  ["uthamageetham", "song of songs", "canticles"],
  ["esaiya", "isaiah", "isa"],
  ["jeremia", "jeremiah", "jer"],
  ["vilapangal", "lamentations", "lam"],
  ["esekiel", "ezekiel", "ezek"],
  ["daniel", "dan"],
  ["hosea", "hos"],
  ["joel"],
  ["amos"],
  ["obadia", "obadiah", "obad"],
  ["jona", "jonah", "jon"],
  ["meekha", "micah", "mic"],
  ["nahum", "nah"],
  ["habakkuk", "habbakkuk", "hab"],
  ["sephania", "zephaniah", "zeph"],
  ["haggai", "hag"],
  ["sakaria", "zakaria", "zechariah", "zech"],
  ["malaki", "malachi", "mal"],
  ["mathayi", "matthew", "matt"],
  ["markos", "mark", "mark"],
  ["luka", "luke", "luk"],
  ["yohannan", "yohan", "john", "jhn"],
  ["apostalanmarude pravruthanangal", "apostles", "acts"],
  ["roma", "romans", "rom"],
  ["korinthoos", "corinthians", "cor"],
  ["korinthoos", "corinthians", "cor"],
  ["galathiya", "galatians", "gal"],
  ["ephesos", "ephesians", "eph"],
  ["philippi", "philippians", "phil"],
  ["kolosai", "colossians", "col"],
  ["thesallonika", "thessalonians", "thess"],
  ["thesallonika", "thessalonians", "thess"],
  ["thimotheyos", "timothy", "tim"],
  ["thimotheyos", "timothy", "tim"],
  ["theethos", "titus", "tit"],
  ["philemon", "philem"],
  ["hebrayar", "hebrews", "heb"],
  ["yakkov", "james", "jas"],
  ["petras", "peter", "pet"],
  ["petras", "peter", "pet"],
  ["yohannan", "john", "jhn"],
  ["yohannan", "john", "jhn"],
  ["yohannan", "john", "jhn"],
  ["yuda", "jude", "jud"],
  ["velipadu", "revelation", "rev"],
  ["thobith", "tobit", "tob"],
  ["yudith", "judith", "jdt"],
  ["jnanam", "wisdom", "wis"],
  ["prabhashakan", "sirach", "ecclesiasticus", "sir"],
  ["baruk", "baruch", "bar"],
  ["maccabayar", "maccabees", "macc"],
  ["maccabayar", "maccabees", "macc"],
];

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,;:'"`_\\/()[\]]/g, " ")
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1")
    .replace(/\b(st|nd|rd|th|no)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const aliasToBook = new Map<string, string>();

function addAliases(id: number, aliases: string[]) {
  const ordinal = ORDINALS[id];
  const wordOrdinal = ordinal ? WORD_ORDINALS[ordinal] : undefined;

  for (const alias of aliases) {
    const normalized = normalizeName(alias);
    if (!normalized) continue;

    // First occurrence wins for ambiguous base names ("samuel"), while the
    // numbered forms below are always explicit.
    if (!aliasToBook.has(normalized)) aliasToBook.set(normalized, String(id));
    if (ordinal) {
      aliasToBook.set(`${ordinal} ${normalized}`, String(id));
      if (wordOrdinal) {
        aliasToBook.set(`${wordOrdinal} ${normalized}`, String(id));
      }
    }
  }
}

BOOK_ALIASES.forEach((aliases, id) => addAliases(id, aliases));
Object.entries(malayalamBooks).forEach(([id, name]) =>
  addAliases(Number(id), [name, name.replace(/^\d+\s+/, "")]),
);

export interface ParsedBibleAddress {
  book: string;
  chapter: string;
  verse: string;
  bookName: string;
  formatted: string;
}

export type ParseAddressResult =
  | { ok: true; value: ParsedBibleAddress }
  | { ok: false; error: string };

export function getBookName(book: string | number): string {
  return malayalamBooks[String(book)] ?? String(book);
}

export function formatAddress(address: {
  book: string;
  chapter: string;
  verse: string;
}): string {
  return `${address.book}:${address.chapter}:${address.verse}`;
}

/**
 * Accepts:
 *   "0:1:1", "0 1 1"          numeric address-bank key
 *   "ulpathi 1:1"             romanized book name
 *   "ഉല്പത്തി 1 : 1"          Malayalam book name
 *   "1 John 4:8"              numbered book
 */
export function parseBibleAddress(rawInput: string): ParseAddressResult {
  const input = rawInput.trim();
  if (!input) return { ok: false, error: "Enter a Bible address first." };

  const compact = input.replace(/\s*:\s*/g, ":").replace(/\s+/g, " ");

  const numericMatch =
    compact.match(/^(\d{1,3}):(\d{1,3}):(\d{1,3})$/) ??
    compact.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);

  if (numericMatch) {
    const [, book, chapter, verse] = numericMatch;
    if (!malayalamBooks[book]) {
      return {
        ok: false,
        error: `Book id ${book} is not in this address bank (0-${BOOK_ALIASES.length - 1}).`,
      };
    }
    if (Number(chapter) < 1 || Number(verse) < 1) {
      return { ok: false, error: "Chapter and verse must be 1 or greater." };
    }
    return {
      ok: true,
      value: buildValue(book, chapter, verse),
    };
  }

  const chapterVerseMatch =
    compact.match(/^(.*?)\s+(\d{1,3}):(\d{1,3})$/) ??
    compact.match(/^(.*?)\s+(\d{1,3})\s+(\d{1,3})$/);
  const chapterOnlyMatch = compact.match(/^(.*?)\s+(\d{1,3})$/);

  const bookPart = chapterVerseMatch?.[1] ?? chapterOnlyMatch?.[1];
  const chapter = chapterVerseMatch?.[2] ?? chapterOnlyMatch?.[2];
  const verse = chapterVerseMatch?.[3] ?? "1";

  if (!bookPart || !chapter) {
    return {
      ok: false,
      error: 'Use a format like "ulpathi 1:1" or "0:1:1".',
    };
  }

  const book = aliasToBook.get(normalizeName(bookPart));
  if (!book) {
    return {
      ok: false,
      error: `Could not find book "${bookPart}". Try "ulpathi", "Genesis", or a numeric id.`,
    };
  }
  if (Number(chapter) < 1 || Number(verse) < 1) {
    return { ok: false, error: "Chapter and verse must be 1 or greater." };
  }

  return { ok: true, value: buildValue(book, chapter, verse) };
}

function buildValue(
  book: string,
  chapter: string,
  verse: string,
): ParsedBibleAddress {
  return {
    book,
    chapter,
    verse,
    bookName: getBookName(book),
    formatted: formatAddress({ book, chapter, verse }),
  };
}
