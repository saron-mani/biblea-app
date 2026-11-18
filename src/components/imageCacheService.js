// imageCacheService.js
//
// Thin wrapper around expo-image's managed disk cache.
//
// A previous version downloaded every image with expo-file-system into a
// custom cache directory. That created three failure modes:
//   1. concurrent downloads wrote to the same file path,
//   2. cache pruning could delete a file while a mounted card still used it,
//   3. a partially written file could be returned as a valid local URI.
//
// expo-image already keeps a 250 MB LRU disk cache on Android and reads from
// it with the default `cachePolicy="disk"`. We only need to warm that cache
// once per URL and let the library own eviction and integrity.

import { Image } from "expo-image";

const inFlight = new Map();

function normalizeUrl(url) {
  return typeof url === "string" && url.length > 0 ? url : null;
}

/**
 * Warms the expo-image disk cache for one URL and always resolves with the
 * original URI. On failure we still return the URI so the image view can try
 * its own load; a transient prefetch failure must not blank the feed.
 */
export function prefetchImage(url) {
  const uri = normalizeUrl(url);
  if (!uri) return Promise.resolve(null);

  const existing = inFlight.get(uri);
  if (existing) return existing;

  const task = Promise.resolve()
    .then(() => Image.prefetch(uri, "disk"))
    .catch(() => false)
    .then(() => uri)
    .finally(() => {
      inFlight.delete(uri);
    });

  inFlight.set(uri, task);
  return task;
}

/** Kept for the existing bibleQuoteService call site. */
export async function getCachedImageUri(remoteUrl) {
  return prefetchImage(remoteUrl);
}

/**
 * Prefetches a batch of URLs once each. Deduping here stops a background
 * refresh and a visible render from fighting over the same network request.
 */
export function prefetchImages(urls = []) {
  const uniqueUrls = Array.from(
    new Set(urls.map(normalizeUrl).filter(Boolean)),
  );

  if (uniqueUrls.length === 0) return Promise.resolve([]);
  return Promise.all(uniqueUrls.map(prefetchImage));
}
