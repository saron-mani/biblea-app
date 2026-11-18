// useBibleQuoteCache.ts
//
// Resolves today's address + images from the cached 5-day window. The cache
// is used immediately on launch; the Google Sheet is rechecked in the
// background afterwards. The widget is refreshed only when the verse changes.

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshQuoteWidget } from "../widgets/quoteWidgetRefresh";
import { getCurrentDayData } from "./bibleQuoteService";
import { didMigrateQuoteBank } from "./quoteRepository";

export interface DailyQuoteData {
  book: string;
  chapter: string;
  verse: string;
  imageA: string;
  imageB: string;
}

interface LoadOptions {
  forceCheck?: boolean;
  /** Background refresh: don't toggle the visible loading state. */
  silent?: boolean;
  /** The silent sheet check only needs the verse, not image prefetching. */
  includeImages?: boolean;
}

interface LoadResult {
  source: string;
}

function toQuoteState(row: any): DailyQuoteData | null {
  if (!row) return null;
  return {
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    imageA: row.imageA ?? "",
    imageB: row.imageB ?? "",
  };
}

function verseKey(row: DailyQuoteData | null): string {
  return row ? `${row.book}|${row.chapter}|${row.verse}` : "none";
}

export function useBibleQuoteCache() {
  const [currentDayData, setCurrentDayData] = useState<DailyQuoteData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [missingForToday, setMissingForToday] = useState<boolean>(false);

  const lastSyncedVerse = useRef<string | null>(null);
  const migrationRefreshed = useRef<boolean>(false);
  const backgroundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (opts: LoadOptions = {}): Promise<LoadResult | undefined> => {
      const {
        forceCheck = false,
        silent = false,
        includeImages = true,
      } = opts;
      try {
        if (!silent) setLoading(true);

        const { currentDayData: row, source } = await getCurrentDayData({
          forceCheck,
          includeImages,
        });
        const state = toQuoteState(row);
        const nextVerseKey = verseKey(state);

        setCurrentDayData(state);
        setMissingForToday(!row);
        setError(null);

        // Avoid repeating the widget render (and its SVG generation) when a
        // background sheet check returns the same verse. A database migration
        // changes the quote text without changing the address, so it needs
        // one refresh of its own.
        const verseChanged = nextVerseKey !== lastSyncedVerse.current;
        const migrated = await didMigrateQuoteBank();

        if (verseChanged || (migrated && !migrationRefreshed.current)) {
          lastSyncedVerse.current = nextVerseKey;
          if (migrated) migrationRefreshed.current = true;
          refreshQuoteWidget(state);
        }

        return { source };
      } catch (err) {
        console.log("[biblea] hook load() caught error:", err);
        setError(err as Error);
        return undefined;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const result = await load();
      if (cancelled || result?.source === "network") return;

      // Cache was used for the first paint. Check the sheet once the app is
      // idle, without showing a spinner or rebuilding the widget unless the
      // verse actually changed.
      backgroundTimer.current = setTimeout(() => {
        void load({ forceCheck: true, silent: true, includeImages: false });
      }, 1500);
    };

    void start();

    return () => {
      cancelled = true;
      if (backgroundTimer.current) clearTimeout(backgroundTimer.current);
    };
  }, [load]);

  const forceSync = useCallback(() => load({ forceCheck: true }), [load]);

  return {
    currentDayData,
    loading,
    error,
    missingForToday,
    forceSync,
  };
}
