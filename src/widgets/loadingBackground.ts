// Static SVG backdrop for JS-rendered widget loading states.
// It uses only rects/ellipses so it stays inside the widget SVG renderer.

import { LOADING_COLORS } from "../components/loadingTheme";

type Theme = "light" | "dark";

export function buildLoadingBackgroundSvg(w: number, h: number, theme: Theme) {
  const width = Math.max(1, Math.round(w));
  const height = Math.max(1, Math.round(h));
  const light = theme !== "dark";

  const base = light ? LOADING_COLORS.lavender : LOADING_COLORS.darkBase;
  const cream = light ? LOADING_COLORS.cream : "#2A2631";
  const lilac = light ? LOADING_COLORS.lilac : "#4A3F66";
  const peach = light ? LOADING_COLORS.peach : "#5A4638";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" rx="14" fill="${base}"/>`,
    `<ellipse cx="${(width * 0.16).toFixed(1)}" cy="${(height * 0.1).toFixed(1)}" rx="${(width * 0.42).toFixed(1)}" ry="${(height * 0.46).toFixed(1)}" fill="${lilac}" fill-opacity="0.34"/>`,
    `<ellipse cx="${(width * 0.94).toFixed(1)}" cy="${(height * 0.95).toFixed(1)}" rx="${(width * 0.38).toFixed(1)}" ry="${(height * 0.42).toFixed(1)}" fill="${peach}" fill-opacity="0.32"/>`,
    `<ellipse cx="${(width * 0.84).toFixed(1)}" cy="${(height * 0.12).toFixed(1)}" rx="${(width * 0.1).toFixed(1)}" ry="${(width * 0.1).toFixed(1)}" fill="${LOADING_COLORS.gold}" fill-opacity="0.22"/>`,
    `<rect x="0" y="${(height * 0.55).toFixed(1)}" width="${width}" height="${(height * 0.45).toFixed(1)}" fill="${cream}" fill-opacity="${light ? "0.28" : "0.12"}"/>`,
    `</svg>`,
  ].join("");
}
