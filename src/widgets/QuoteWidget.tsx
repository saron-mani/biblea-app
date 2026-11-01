// src/widgets/QuoteWidget.tsx
//
// Widget UI, modelled on src/components/QuotePage.tsx:
//   - a random pastel + layered-texture background (new one each day)
//   - a frosted-looking card with the logo, the verse text and the reference
//   - light and dark variants (the task handler renders both; Android shows
//     the one matching the device theme)
//
// Rules from react-native-android-widget: no hooks, not async, and only the
// library's primitives (no View / Text / Image from react-native).
"use no memo"; // stops React Compiler from injecting hooks into this component

import {
  FlexWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";
import { buildBackgroundSvg } from "./backgrounds";

const RADIUS = 14; // widget corner radius
const CARD_RADIUS = 11; // card corner radius

type Theme = "light" | "dark";

// Light theme: the original logo. Dark theme: the white logo.
const LOGO_SVG_LIGHT = require("../../assets/images/name-img.svg");
const LOGO_SVG_DARK = require("../../assets/images/name-img-white.svg");

const THEMES = {
  light: {
    cardBg: "rgba(255, 255, 255, 0.45)", // translucent white
    text: "#000000",
    logo: LOGO_SVG_LIGHT,
    fallbackBg: "#E9E6F2",
  },
  dark: {
    cardBg: "rgba(22, 22, 22, 0.55)", // dark charcoal, translucent
    text: "#E3E3E3", // soft off-white instead of pure white
    logo: LOGO_SVG_DARK,
    fallbackBg: "#1C1B1F",
  },
} as const;

interface QuoteWidgetProps {
  /** Verse text from quoteBank.json. */
  quote?: string | null;
  /** e.g. "യോഹന്നാൻ 3:16" */
  address?: string | null;
  /** Today's date key (yyyy-mm-dd); decides the day's background. */
  dateKey?: string;
  /** Widget size in dp (from widgetInfo). */
  width: number;
  height: number;
  theme?: Theme;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Sizes everything from the widget's dimensions so it adapts to any cell grid. */
function computeLayout(w: number, h: number, textLength: number) {
  const pad = Math.round(clamp(Math.min(w, h) * 0.07, 8, 24));
  const cardW = Math.round(w * 0.88);
  const innerW = cardW - pad * 2;
  const logoH = Math.round(clamp(h * 0.16, 22, 44));
  const logoW = Math.round(logoH * 1.5); // logo is shown in a 3:2 box in the app
  const addrFs = Math.round(clamp(h * 0.055, 9, 15));
  const gap = Math.round(clamp(h * 0.03, 4, 12));

  // Space left for the verse text inside a card that may use ~90% of the height.
  const textH = h * 0.9 - pad * 2 - logoH - addrFs * 1.5 - gap * 2;

  // Rough fit: each Malayalam char needs about 0.9 * fontSize^2 of area.
  const fitFs = Math.sqrt(
    (innerW * Math.max(textH, 20)) / (Math.max(textLength, 1) * 0.9),
  );
  const fontSize = Math.round(clamp(fitFs, 9, 18));
  const maxLines = Math.max(2, Math.floor(textH / (fontSize * 1.5)));

  return { pad, cardW, logoH, logoW, addrFs, gap, fontSize, maxLines };
}

export function QuoteWidget({
  quote,
  address,
  dateKey = "static",
  width,
  height,
  theme = "light",
}: QuoteWidgetProps) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const t = THEMES[theme];

  // No verse yet (offline on first install, or no row for today in the sheet).
  if (!quote || !address) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: t.fallbackBg,
          borderRadius: RADIUS,
          padding: 16,
        }}
      >
        <TextWidget
          text="Open Biblea to load today's verse"
          style={{ fontSize: 15, color: t.text }}
        />
      </FlexWidget>
    );
  }

  const L = computeLayout(w, h, quote.length);

  return (
    <OverlapWidget
      clickAction="OPEN_APP" // tapping the widget opens the app
      style={{
        height: "match_parent",
        width: "match_parent",
        borderRadius: RADIUS,
        overflow: "hidden",
        backgroundColor: t.fallbackBg,
      }}
    >
      {/* Background: today's random pastel + texture */}
      <SvgWidget
        svg={buildBackgroundSvg(w, h, dateKey, theme, RADIUS)}
        style={{ width: w, height: h }}
      />

      {/* Card, centred like QuotePage */}
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FlexWidget
          style={{
            width: L.cardW,
            padding: L.pad,
            borderRadius: CARD_RADIUS,
            backgroundColor: t.cardBg,
          }}
        >
          <SvgWidget svg={t.logo} style={{ width: L.logoW, height: L.logoH }} />

          <TextWidget
            text={quote}
            maxLines={L.maxLines}
            truncate="END"
            allowFontScaling={false}
            style={{ fontSize: L.fontSize, color: t.text, marginTop: L.gap }}
          />

          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: L.gap,
            }}
          >
            <TextWidget
              text={address}
              allowFontScaling={false}
              style={{ fontSize: L.addrFs, color: t.text }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}
