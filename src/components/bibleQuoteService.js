import * as AsyncStorageModule from "@react-native-async-storage/async-storage";
import Papa from "papaparse";
import {
  getCachedImageUri,
  prefetchImages,
  pruneUnusedImages,
} from "./imageCacheService";

// Safe AsyncStorage resolution for Hermes
const AsyncStorage = AsyncStorageModule.default ?? AsyncStorageModule;

const SHEET_ID = "1rqVkg2fYA3-kvFzc3vRuMA9HF8lnTvE4ESWNXD0e1dw";
const SHEET_GID = "0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const WINDOW_DAYS = 5;

// BUMPED TO v4: This instantly invalidates your locked/poisoned cache
// and forces a fresh network fetch the next time you open the app!
const CACHE_KEYS = {
  WINDOW: "biblea_window_v4",
  LAST_FETCHED: "biblea_last_fetched_v4",
};

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function addDays(dateKey, n) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

async function fetchRawCSV() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return res.text();
}

function parseCSVToDatedMap(csvText) {
  const { data } = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const map = {};
  for (const row of data) {
    // 1. BULLETPROOF HEADERS: Case-insensitive fallback
    const rawDate = (row.Date || row.date || row.DATE || "").trim();
    if (!rawDate) continue;

    // 2. BULLETPROOF DATES: Let JS natively parse M/D/YYYY, YYYY-MM-DD, etc.
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) continue; // Skip invalid date formats entirely
    const key = toDateKey(d);

    const book = String(row.Book || row.book || row.BOOK || "").trim();
    const chapter = String(
      row.Chapter || row.chapter || row.CHAPTER || "",
    ).trim();
    const verse = String(row.Verse || row.verse || row.VERSE || "").trim();
    const imageA = String(row.ImageA || row.imageA || row.imagea || "").trim();
    const imageB = String(row.ImageB || row.imageB || row.imageb || "").trim();

    map[key] = { book, chapter, verse, imageA, imageB };
  }
  return map;
}

function buildWindow(fullMap, startKey) {
  const window = {};
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const key = addDays(startKey, i);
    if (fullMap[key]) window[key] = fullMap[key];
  }
  return window;
}

async function readCache() {
  const pairs = await AsyncStorage.multiGet([
    CACHE_KEYS.WINDOW,
    CACHE_KEYS.LAST_FETCHED,
  ]);
  const map = {};
  pairs.forEach(([key, value]) => {
    map[key] = value;
  });
  return {
    window: map[CACHE_KEYS.WINDOW] ? JSON.parse(map[CACHE_KEYS.WINDOW]) : null,
    lastFetched: map[CACHE_KEYS.LAST_FETCHED] || null,
  };
}

async function writeCache(window, fetchedOn) {
  await AsyncStorage.multiSet([
    [CACHE_KEYS.WINDOW, JSON.stringify(window)],
    [CACHE_KEYS.LAST_FETCHED, fetchedOn],
  ]);
}

function alreadyFetchedToday(lastFetched) {
  return lastFetched === todayKey();
}

function allImageUrlsIn(window) {
  return Object.values(window).flatMap((row) => [row.imageA, row.imageB]);
}

async function getCurrentDayDataInner({ forceCheck = false } = {}) {
  const cache = await readCache();
  const today = todayKey();

  let window;
  let source;

  // VERIFY CACHE ACTUALLY HAS TODAY: If today is missing from the cache,
  // it forces a network check so updates to the sheet appear instantly.
  const hasTodayInCache = cache.window && cache.window[today];

  if (
    cache.window &&
    alreadyFetchedToday(cache.lastFetched) &&
    hasTodayInCache &&
    !forceCheck
  ) {
    window = cache.window;
    source = "cache";
  } else {
    try {
      const csv = await fetchRawCSV();
      const fullMap = parseCSVToDatedMap(csv);
      window = buildWindow(fullMap, today);
      await writeCache(window, today);
      source = "network";
      pruneUnusedImages(allImageUrlsIn(window));
    } catch (err) {
      console.log("[biblea] sheet fetch/parse failed:", err);
      if (cache.window) {
        window = cache.window;
        source = "cache-fallback";
      } else {
        throw err;
      }
    }
  }

  const todayRow = window[today] || null;
  const currentDayData = todayRow
    ? {
        ...todayRow,
        imageA: todayRow.imageA
          ? await getCachedImageUri(todayRow.imageA)
          : null,
        imageB: todayRow.imageB
          ? await getCachedImageUri(todayRow.imageB)
          : null,
      }
    : null;

  const upcomingUrls = Object.entries(window)
    .filter(([date]) => date !== today)
    .flatMap(([, row]) => [row.imageA, row.imageB])
    .filter(Boolean);
  prefetchImages(upcomingUrls);

  return { currentDayData, window, source };
}

async function getCurrentDayData(opts) {
  try {
    return await getCurrentDayDataInner(opts);
  } catch (err) {
    console.log("[biblea] getCurrentDayData CRASHED:", err && err.message, err);
    throw err;
  }
}

export { getCurrentDayData, todayKey };

