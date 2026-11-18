// Web keeps the JSON lookup (loaded lazily, in a separate chunk) because
// expo-sqlite web support needs wasm/SharedArrayBuffer configuration.

type QuoteBank = Record<string, Record<string, Record<string, string>>>;

let bankPromise: Promise<QuoteBank> | null = null;

async function getBank(): Promise<QuoteBank> {
  if (!bankPromise) {
    bankPromise = import("../quoteBank.json").then(
      (module) => module.default as QuoteBank,
    );
  }
  return bankPromise;
}

export async function getVerse(
  book: string,
  chapter: string,
  verse: string,
): Promise<string | null> {
  const bank = await getBank();
  return bank[String(book)]?.[String(chapter)]?.[String(verse)] ?? null;
}

/** Web reads the JSON directly, so there is no on-device database to replace. */
export async function didMigrateQuoteBank(): Promise<boolean> {
  return false;
}
