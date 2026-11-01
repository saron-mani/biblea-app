// src/widgets/backgrounds.ts
//
// Random pastel + layered-texture backgrounds for the widget.
//
// Everything is plain SVG shapes (rects, circles, ellipses, lines, curves)
// at low opacity: no filters, masks or gradients, so it stays within what the
// widget's SVG renderer can draw.
//
// The style and the colours are derived from the date, so the widget keeps
// the same background all day and picks a new one tomorrow. Light and dark
// use the same style and layout; dark just uses a deeper, muted palette.

export type WidgetTheme = "light" | "dark";

/** Set to false to use the same bright pastels in dark mode as in light mode. */
const DIM_BACKGROUND_IN_DARK = true;

interface Palette {
  base: string;
  light: string;
  dark: string;
  a: string;
  b: string;
}

type Rng = () => number;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): Rng {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%)`;
}

function makePalette(r: Rng, theme: WidgetTheme): Palette {
  const h = r() * 360; // always consumed, so light and dark share the same hue
  if (theme === "dark" && DIM_BACKGROUND_IN_DARK) {
    return {
      base: hsl(h, 26, 24),
      light: hsl(h, 28, 33),
      dark: hsl(h, 30, 14),
      a: hsl(h + 40, 28, 29),
      b: hsl(h + 320, 28, 28),
    };
  }
  return {
    base: hsl(h, 62, 86),
    light: hsl(h, 70, 94),
    dark: hsl(h, 45, 70),
    a: hsl(h + 40, 66, 83),
    b: hsl(h + 320, 66, 85),
  };
}

const f0 = (n: number) => n.toFixed(0);
const f1 = (n: number) => n.toFixed(1);

function grain(r: Rng, n: number, c1: string, c2: string): string {
  let o = "";
  for (let i = 0; i < n; i++) {
    o += `<circle cx="${f1(r() * 200)}" cy="${f1(r() * 200)}" r="${(0.4 + r() * 0.9).toFixed(2)}" fill="${i % 2 ? c1 : c2}" opacity="${(0.15 + r() * 0.3).toFixed(2)}"/>`;
  }
  return o;
}

function blob(
  r: Rng,
  fill: string,
  op: number,
  min: number,
  max: number,
): string {
  const rx = min + r() * (max - min);
  return `<ellipse cx="${f0(r() * 200)}" cy="${f0(r() * 200)}" rx="${f0(rx)}" ry="${f0(rx * (0.6 + r() * 0.6))}" transform="rotate(${f0(r() * 180)} 100 100)" fill="${fill}" opacity="${op}"/>`;
}

const rect = (P: Palette) =>
  `<rect width="200" height="200" fill="${P.base}"/>`;

type StyleFn = (r: Rng, P: Palette) => string;

const STYLES: StyleFn[] = [
  // 1. Paper grain
  (r, P) =>
    rect(P) +
    blob(r, P.a, 0.5, 50, 90) +
    blob(r, P.b, 0.45, 40, 80) +
    grain(r, 700, P.dark, P.light),

  // 2. Hatching
  (r, P) => {
    let o = rect(P);
    for (let i = -200; i < 400; i += 9) {
      o += `<line x1="${i}" y1="0" x2="${i + 200}" y2="200" stroke="${P.dark}" stroke-width="1.2" opacity="0.33"/>`;
    }
    return o + blob(r, P.a, 0.5, 40, 70) + blob(r, P.light, 0.55, 30, 60);
  },

  // 3. Confetti dots
  (r, P) => {
    let o = rect(P);
    const cols = [P.light, P.a, P.b];
    for (let i = 0; i < 34; i++) {
      o += `<circle cx="${f0(r() * 200)}" cy="${f0(r() * 200)}" r="${f1(3 + r() * 15)}" fill="${cols[i % 3]}" opacity="0.6"/>`;
    }
    for (let j = 0; j < 70; j++) {
      o += `<circle cx="${f0(r() * 200)}" cy="${f0(r() * 200)}" r="${f1(1 + r() * 2)}" fill="${P.dark}" opacity="0.3"/>`;
    }
    return o;
  },

  // 4. Soft waves
  (r, P) => {
    let o = rect(P);
    const cols = [P.light, P.a, P.b];
    for (let k = 0; k < 6; k++) {
      const y = 14 + k * 36 + r() * 10;
      const a = 14 + r() * 26;
      o += `<path d="M-10 ${f0(y)} Q45 ${f0(y - a)} 100 ${f0(y)} T210 ${f0(y)}" fill="none" stroke="${cols[k % 3]}" stroke-width="${f0(10 + r() * 10)}" opacity="0.6"/>`;
    }
    return o + grain(r, 260, P.dark, P.light);
  },

  // 5. Graph paper
  (r, P) => {
    let o =
      rect(P) + blob(r, P.a, 0.55, 40, 80) + blob(r, P.light, 0.55, 40, 70);
    for (let i = 0; i <= 200; i += 20) {
      o += `<line x1="${i}" y1="0" x2="${i}" y2="200" stroke="${P.dark}" stroke-width="0.8" opacity="0.28"/>`;
      o += `<line x1="0" y1="${i}" x2="200" y2="${i}" stroke="${P.dark}" stroke-width="0.8" opacity="0.28"/>`;
    }
    return o;
  },

  // 6. Layered blobs
  (r, P) =>
    rect(P) +
    blob(r, P.a, 0.6, 60, 95) +
    blob(r, P.b, 0.55, 50, 90) +
    blob(r, P.light, 0.6, 40, 80) +
    blob(r, P.dark, 0.3, 30, 60) +
    blob(r, P.a, 0.45, 30, 60) +
    grain(r, 320, P.dark, P.light),
];

/**
 * Full-widget background SVG for the given day.
 * w/h are the widget size in dp; the 200x200 design is scaled to cover it
 * (centre-cropped, never stretched) and clipped to rounded corners.
 */
export function buildBackgroundSvg(
  w: number,
  h: number,
  dateKey: string,
  theme: WidgetTheme,
  radius: number,
): string {
  const seed = hashStr(dateKey);
  const pick = mulberry32(seed);
  const style = STYLES[Math.floor(pick() * STYLES.length)];

  // Same seed for light and dark, so only the colours differ between them.
  const r = mulberry32(seed ^ 0x9e3779b9);
  const P = makePalette(r, theme);
  const inner = style(r, P);

  const S = Math.max(w, h);
  const k = S / 200;
  const tx = (w - S) / 2;
  const ty = (h - S) / 2;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}">` +
    `<defs><clipPath id="clip"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}"/></clipPath></defs>` +
    `<g clip-path="url(#clip)"><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">` +
    inner +
    `</g></g></svg>`
  );
}
