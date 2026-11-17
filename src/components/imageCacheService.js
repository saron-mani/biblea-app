// imageCacheService.js
//
// Downloads a remote image URL to disk once, then reuses the local copy
// on every future call. Pair this with bibleQuoteService.js so the two
// image URLs for a given day are actual files on the device, not just
// strings pointing at the network.
//
// DEPENDENCIES:
//   npx expo install expo-file-system

import * as FileSystem from "expo-file-system/legacy";

const CACHE_DIR = `${FileSystem.cacheDirectory}biblea-images/`;

async function ensureDirExists() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

// Cheap djb2 hash — just needs to turn a URL into a safe, stable filename.
function hashUrl(url) {
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 33) ^ url.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function extensionFromUrl(url) {
  const match = url.split("?")[0].match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? match[0] : ".jpg";
}

function localPathForUrl(url) {
  return `${CACHE_DIR}${hashUrl(url)}${extensionFromUrl(url)}`;
}

/**
 * Returns a local file:// URI for a remote image URL, downloading it
 * first if it isn't already on disk. Falls back to the remote URL itself
 * if the download fails (e.g. offline), so the UI still has something to
 * render instead of a broken image.
 */
async function getCachedImageUri(remoteUrl) {
  if (!remoteUrl) return null;

  try {
    await ensureDirExists();
    const localPath = localPathForUrl(remoteUrl);
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;

    const result = await FileSystem.downloadAsync(remoteUrl, localPath);
    return result.uri;
  } catch (_err) {
    return remoteUrl;
  }
}

/**
 * Kicks off downloads for a batch of URLs with a small concurrency limit so
 * a background refresh cannot saturate the device's network stack. Never
 * rejects; individual failures are swallowed per-URL.
 */
function prefetchImages(urls) {
  const queue = urls.filter(Boolean);
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        results.push(await getCachedImageUri(url));
      } catch {
        // Best-effort prefetch: the next render can still fall back to remote.
      }
    }
  }

  const workerCount = Math.min(3, queue.length);
  return Promise.all(Array.from({ length: workerCount }, worker)).then(
    () => results,
  );
}

/**
 * Deletes any cached image file that isn't in the given "keep" list.
 * Call this after building a fresh 5-day window so images for days that
 * have rolled out of the window don't pile up on disk forever.
 */
async function pruneUnusedImages(keepUrls) {
  try {
    await ensureDirExists();
    const keepPaths = new Set(keepUrls.filter(Boolean).map(localPathForUrl));
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    await Promise.all(
      files.map((file) => {
        const fullPath = `${CACHE_DIR}${file}`;
        if (!keepPaths.has(fullPath)) {
          return FileSystem.deleteAsync(fullPath, { idempotent: true });
        }
        return null;
      }),
    );
  } catch (_err) {
    // best-effort cleanup — a failure here shouldn't affect the app
  }
}

export { getCachedImageUri, prefetchImages, pruneUnusedImages };

