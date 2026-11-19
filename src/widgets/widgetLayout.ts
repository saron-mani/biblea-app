// Shared sizing rules for the native widget and its web preview.
// Keeping this in one place means the preview stays accurate if widget spacing
// or font scaling is tuned later.

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Matches minResizeWidth/minResizeHeight in app.json. */
export const MIN_WIDGET_WIDTH_DP = 180;
export const MIN_WIDGET_HEIGHT_DP = 180;

export interface WidgetLayout {
  pad: number;
  cardW: number;
  innerW: number;
  logoH: number;
  logoW: number;
  addrFs: number;
  gap: number;
  fontSize: number;
  maxLines: number;
}

/** Sizes everything from the widget's dimensions so it adapts to any cell grid. */
export function computeWidgetLayout(
  w: number,
  h: number,
  textLength: number,
): WidgetLayout {
  const safeW = Math.max(MIN_WIDGET_WIDTH_DP, Math.round(w));
  const safeH = Math.max(MIN_WIDGET_HEIGHT_DP, Math.round(h));

  const pad = Math.round(clamp(Math.min(safeW, safeH) * 0.07, 8, 24));
  const cardW = Math.max(140, Math.round(safeW * 0.88));
  const innerW = Math.max(80, cardW - pad * 2);
  const logoH = Math.round(clamp(safeH * 0.16, 22, 44));
  const logoW = Math.round(logoH * 1.5); // logo is shown in a 3:2 box in the app
  const addrFs = Math.round(clamp(safeH * 0.055, 9, 15));
  const gap = Math.round(clamp(safeH * 0.03, 4, 12));

  // Space left for the verse text inside a card that may use ~90% of the height.
  const effectiveCardHeight = Math.max(120, safeH * 0.9);
  const textH = Math.max(
    24,
    effectiveCardHeight - pad * 2 - logoH - addrFs * 1.5 - gap * 2,
  );

  // Rough fit: each Malayalam char needs about 0.9 * fontSize^2 of area.
  const fitFs = Math.sqrt(
    (innerW * textH) / (Math.max(textLength, 1) * 0.9),
  );
  const fontSize = Math.round(clamp(fitFs, 9, 18));
  const maxLines = Math.max(2, Math.floor(textH / (fontSize * 1.5)));

  return {
    pad,
    cardW,
    innerW,
    logoH,
    logoW,
    addrFs,
    gap,
    fontSize,
    maxLines,
  };
}
