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
import { LOADING_COLORS, LOADING_COPY } from "../components/loadingTheme";
import { buildBackgroundSvg } from "./backgrounds";
import { buildLoadingBackgroundSvg } from "./loadingBackground";
import {
  computeWidgetLayout,
  MIN_WIDGET_HEIGHT_DP,
  MIN_WIDGET_WIDTH_DP,
} from "./widgetLayout";

const RADIUS = 14; // widget corner radius
const CARD_RADIUS = 11; // card corner radius

type Theme = "light" | "dark";

// Light theme: the original logo. Dark theme: the white logo.
const LOGO_SVG_LIGHT = require("../../assets/images/name-img.svg");
const LOGO_SVG_DARK = require("../../assets/images/name-img-white.svg");

const THEMES = {
  light: {
    cardBg: "rgba(255, 255, 255, 0.45)", // translucent white
    loadingCardBg: "rgba(255, 255, 255, 0.74)",
    text: "#000000",
    loadingMuted: LOADING_COLORS.muted,
    logo: LOGO_SVG_LIGHT,
    fallbackBg: LOADING_COLORS.lavender,
  },
  dark: {
    cardBg: "rgba(22, 22, 22, 0.55)", // dark charcoal, translucent
    loadingCardBg: LOADING_COLORS.darkCard,
    text: "#E3E3E3", // soft off-white instead of pure white
    loadingMuted: "#B9B2C4",
    logo: LOGO_SVG_DARK,
    fallbackBg: LOADING_COLORS.darkBase,
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

export function QuoteWidget({
  quote,
  address,
  dateKey = "static",
  width,
  height,
  theme = "light",
}: QuoteWidgetProps) {
  // Defensive floor: a bad measured size must not shrink the internal card.
  const w = Math.max(MIN_WIDGET_WIDTH_DP, Math.round(Number(width) || 0));
  const h = Math.max(MIN_WIDGET_HEIGHT_DP, Math.round(Number(height) || 0));
  const t = THEMES[theme];

  // No verse yet (offline on first install, or no row for today in the sheet).
  if (!quote || !address) {
    const L = computeWidgetLayout(w, h, 40);
    return (
      <OverlapWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          borderRadius: RADIUS,
          overflow: "hidden",
          backgroundColor: t.fallbackBg,
        }}
      >
        <SvgWidget
          svg={buildLoadingBackgroundSvg(w, h, theme)}
          style={{ width: w, height: h }}
        />

        <FlexWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
            padding: 12,
          }}
        >
          <FlexWidget
            style={{
              width: L.cardW,
              padding: L.pad,
              borderRadius: CARD_RADIUS,
              backgroundColor: t.loadingCardBg,
            }}
          >
            <SvgWidget svg={t.logo} style={{ width: L.logoW, height: L.logoH }} />

            <TextWidget
              text={LOADING_COPY.title}
              maxLines={1}
              allowFontScaling={false}
              style={{ fontSize: L.addrFs + 1, color: t.text, marginTop: L.gap }}
            />
            <TextWidget
              text={LOADING_COPY.subtitle}
              maxLines={1}
              allowFontScaling={false}
              style={{ fontSize: L.addrFs, color: t.loadingMuted, marginTop: 3 }}
            />
            <TextWidget
              text="✦"
              allowFontScaling={false}
              style={{
                fontSize: L.addrFs + 2,
                color: LOADING_COLORS.gold,
                marginTop: L.gap,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </OverlapWidget>
    );
  }

  const L = computeWidgetLayout(w, h, quote.length);

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
