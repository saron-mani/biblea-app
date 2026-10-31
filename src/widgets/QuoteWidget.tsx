// src/widgets/QuoteWidget.tsx
//
// Widget UI, modelled on src/components/QuotePage.tsx:
//   - imageA full-bleed, imageB layered on top at 50% opacity (both cropped
//     "cover"-style, never stretched)
//   - a frosted-looking card with the logo, the verse text and the reference
//
// Rules from react-native-android-widget: no hooks, not async, and only the
// library's primitives (no View / Text / Image from react-native).
"use no memo"; // stops React Compiler from injecting hooks into this component

import {
    FlexWidget,
    ImageWidget,
    OverlapWidget,
    SvgWidget,
    TextWidget,
} from "react-native-android-widget";

// ---- Switches ---------------------------------------------------------
/**
 * true  -> the two photos are composed in an SVG, which gives true "cover"
 *          cropping and 50% opacity for imageB.
 * false -> fallback: plain ImageWidget with imageA only (it can't crop, and
 *          has no opacity). Use this if the SVG backdrop renders blank.
 */
const USE_SVG_BACKDROP = true;
// ------------------------------------------------------------------------

const RADIUS = 20; // widget corner radius
const CARD_RADIUS = 15; // same as QuotePage's card
const CARD_BG = "rgba(255, 255, 255, 0.35)"; // stand-in for the blur (widgets can't blur)
const TEXT_COLOR = "#000000";

// Same logo QuotePage uses.
const LOGO_SVG = require("../../assets/images/name-img.svg");

interface QuoteWidgetProps {
  /** Verse text from quoteBank.json. */
  quote?: string | null;
  /** e.g. "യോഹന്നാൻ 3:16" */
  address?: string | null;
  /** Background photo: data:image/...;base64 URI. */
  imageA?: string | null;
  /** Second photo, drawn over imageA at 50% opacity. */
  imageB?: string | null;
  /** Widget size in dp (from widgetInfo). */
  width: number;
  height: number;
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

/**
 * imageA at full opacity, imageB at 50% on top, both centre-cropped
 * ("slice" = CSS object-fit: cover), clipped to rounded corners.
 */
function buildBackdropSvg(
  w: number,
  h: number,
  imageA?: string | null,
  imageB?: string | null,
) {
  const img = (src: string, opacity: number) =>
    `<image x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}" xlink:href="${src}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="100%" height="100%" viewBox="0 0 ${w} ${h}">` +
    `<defs><clipPath id="clip"><rect width="${w}" height="${h}" rx="${RADIUS}" ry="${RADIUS}"/></clipPath></defs>` +
    `<g clip-path="url(#clip)">` +
    `<rect width="${w}" height="${h}" fill="#1C1B1F"/>` +
    (imageA ? img(imageA, 1) : "") +
    (imageB ? img(imageB, 0.5) : "") +
    `</g></svg>`
  );
}

export function QuoteWidget({
  quote,
  address,
  imageA,
  imageB,
  width,
  height,
}: QuoteWidgetProps) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));

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
          backgroundColor: "#1C1B1F",
          borderRadius: RADIUS,
          padding: 16,
        }}
      >
        <TextWidget
          text="Open Biblea to load today's verse"
          style={{ fontSize: 15, color: "#FFFFFF" }}
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
        backgroundColor: "#1C1B1F",
      }}
    >
      {/* Backdrop: the two photos */}
      {USE_SVG_BACKDROP ? (
        <SvgWidget
          svg={buildBackdropSvg(w, h, imageA, imageB)}
          style={{ width: w, height: h }}
        />
      ) : imageA ? (
        <ImageWidget
          image={imageA as any}
          imageWidth={w}
          imageHeight={h}
          radius={RADIUS}
        />
      ) : null}

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
            backgroundColor: CARD_BG,
          }}
        >
          <SvgWidget
            svg={LOGO_SVG}
            style={{ width: L.logoW, height: L.logoH }}
          />

          <TextWidget
            text={quote}
            maxLines={L.maxLines}
            truncate="END"
            allowFontScaling={false}
            style={{
              fontSize: L.fontSize,
              color: TEXT_COLOR,
              marginTop: L.gap,
            }}
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
              style={{ fontSize: L.addrFs, color: TEXT_COLOR }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}
