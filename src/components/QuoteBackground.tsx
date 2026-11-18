import { Image } from "expo-image";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { prefetchImage } from "./imageCacheService";

export type SoftBlob = {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  peak: number;
};

/* ------------------------------------------------------------------ */
/* Stable, seed-derived soft light pattern                             */
/* ------------------------------------------------------------------ */

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic for a quote, so recycled cards never reshuffle the pattern. */
export function createSoftBlobs(seed: string): SoftBlob[] {
  const hash = hashString(seed);
  const random = mulberry32(hash);
  const count = 3 + (hash % 3);

  return Array.from({ length: count }, (_, index) => ({
    id: `soft-blob-${hash}-${index}`,
    cx: random() * 100,
    cy: random() * 100,
    rx: 25 + random() * 35,
    ry: 20 + random() * 35,
    peak: 0.55 + random() * 0.45,
  }));
}

/* ------------------------------------------------------------------ */
/* Image loading                                                        */
/* ------------------------------------------------------------------ */

type ResilientSource = { uri: string; cacheKey?: string };

function useResilientImageSource(uri: string | null | undefined) {
  const [source, setSource] = useState<ResilientSource | null>(() =>
    uri ? { uri } : null,
  );
  const previousUri = useRef(uri);
  const retryCount = useRef(0);

  useEffect(() => {
    if (previousUri.current === uri) return;
    previousUri.current = uri;
    retryCount.current = 0;
    setSource(uri ? { uri } : null);
  }, [uri]);

  const handleError = useCallback(() => {
    // A local image can fail if the OS evicted its cache. One retry with a
    // new cache key forces a fresh fetch without risking an error loop.
    if (!uri || retryCount.current >= 1) return;
    retryCount.current += 1;
    void prefetchImage(uri);
    setSource({ uri, cacheKey: `${uri}#retry` });
  }, [uri]);

  return { source, handleError };
}

const BackgroundImage = memo(function BackgroundImage({
  uri,
  transition,
  priority,
}: {
  uri: string | null | undefined;
  transition?: number;
  priority: "high" | "normal";
}) {
  const { source, handleError } = useResilientImageSource(uri);
  if (!source) return null;

  return (
    <Image
      source={source}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      cachePolicy="disk"
      transition={transition}
      priority={priority}
      onError={handleError}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Soft light overlay                                                   */
/* ------------------------------------------------------------------ */

const SoftLight = memo(function SoftLight({ blobs }: { blobs: SoftBlob[] }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <Defs>
        {blobs.map((blob) => (
          <RadialGradient
            key={blob.id}
            id={blob.id}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <Stop
              offset="0"
              stopColor="#ffffff"
              stopOpacity={blob.peak * 0.2}
            />
            <Stop
              offset="0.55"
              stopColor="#ffffff"
              stopOpacity={blob.peak * 0.07}
            />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {blobs.map((blob) => (
        <Ellipse
          key={blob.id}
          cx={blob.cx}
          cy={blob.cy}
          rx={blob.rx}
          ry={blob.ry}
          fill={`url(#${blob.id})`}
        />
      ))}
    </Svg>
  );
});

/* ------------------------------------------------------------------ */
/* Public backdrop                                                      */
/* ------------------------------------------------------------------ */

interface QuoteBackgroundProps {
  primaryUri?: string | null;
  secondaryUri?: string | null;
  blobs: SoftBlob[];
  transition?: number;
}

/**
 * Two cached images instead of three full-screen layers, and no MaskedView or
 * runtime blurRadius. The soft humps are now a cheap SVG overlay, which keeps
 * the look while avoiding the GPU texture pressure that caused blank frames.
 */
const QuoteBackground = memo(function QuoteBackground({
  primaryUri,
  secondaryUri,
  blobs,
  transition,
}: QuoteBackgroundProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <BackgroundImage
        uri={primaryUri}
        transition={transition}
        priority="high"
      />
      {secondaryUri ? (
        <View style={styles.secondaryLayer}>
          <BackgroundImage
            uri={secondaryUri}
            transition={transition}
            priority="normal"
          />
          <SoftLight blobs={blobs} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#151515",
  },
  secondaryLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
});

export default QuoteBackground;
