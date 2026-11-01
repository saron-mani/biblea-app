// useBibleQuoteCache.ts
//
// Drop this into your quote screen. It resolves TODAY's address+images
// from the cached 5-day window (fetching/rebuilding it only when needed)
// and hands it back typed, so consumers don't hit TS's "never" inference
// that a plain .js file with an untyped useState(null) would cause.

import { useCallback, useEffect, useState } from "react";
import { refreshQuoteWidget } from "../widgets/widget-task-handler";
import { getCurrentDayData } from "./bibleQuoteService";

export interface DailyQuoteData {
  book: string;
  chapter: string;
  verse: string;
  imageA: string;
  imageB: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuoteState(row: any): DailyQuoteData | null {
  if (!row) return null;
  return {
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    imageA: row.imageA,
    imageB: row.imageB,
  };
}

export function useBibleQuoteCache() {
  const [currentDayData, setCurrentDayData] = useState<DailyQuoteData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [missingForToday, setMissingForToday] = useState<boolean>(false);

  const load = useCallback(async (opts?: { forceCheck?: boolean }) => {
    try {
      setLoading(true);
      const { currentDayData: row } = await getCurrentDayData(opts);
      setCurrentDayData(toQuoteState(row));
      setMissingForToday(!row); // sheet has no row for today's date
      setError(null);
      refreshQuoteWidget(); // update the home-screen widget too (no-op if none is placed)
    } catch (err) {
      console.log("[biblea] hook load() caught error:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Optional: call on app foreground / pull-to-refresh to re-check the
  // sheet for edits before the cache would naturally roll over.
  const forceSync = useCallback(() => load({ forceCheck: true }), [load]);

  return {
    currentDayData, // DailyQuoteData | null
    loading,
    error,
    missingForToday, // true if today's date has no matching row in the sheet
    forceSync,
  };
}
