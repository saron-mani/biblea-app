// Web-only visual replica of the Android widget. It uses the exact same
// background generator and sizing helper as src/widgets/QuoteWidget.tsx, so
// changes to the widget layout are reflected here automatically.

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { LOADING_COLORS, LOADING_COPY } from "./loadingTheme";
import { buildBackgroundSvg } from "../widgets/backgrounds";
import { computeWidgetLayout } from "../widgets/widgetLayout";

export type WidgetPreviewTheme = "light" | "dark";

export interface WidgetPreviewProps {
  quote?: string | null;
  address?: string | null;
  dateKey?: string;
  theme?: WidgetPreviewTheme;
  scale?: number;
}

const W = 300;
const H = 180;
const RADIUS = 14;
const CARD_RADIUS = 11;

const LOGO_LIGHT = require("../../assets/images/name-img.svg");
const LOGO_DARK = require("../../assets/images/name-img-white.svg");

const THEMES = {
  light: {
    cardBg: "rgba(255, 255, 255, 0.45)",
    text: "#000000",
    fallbackBg: LOADING_COLORS.lavender,
    loadingCardBg: LOADING_COLORS.card,
    loadingMuted: LOADING_COLORS.muted,
    logo: LOGO_LIGHT,
  },
  dark: {
    cardBg: "rgba(22, 22, 22, 0.55)",
    text: "#E3E3E3",
    fallbackBg: LOADING_COLORS.darkBase,
    loadingCardBg: LOADING_COLORS.darkCard,
    loadingMuted: "#B9B2C4",
    logo: LOGO_DARK,
  },
} as const;

export default function WidgetPreview({
  quote,
  address,
  dateKey = "static",
  theme = "light",
  scale = 1.6,
}: WidgetPreviewProps) {
  const t = THEMES[theme];
  const s = Math.max(0.5, scale);
  const outerStyle = [
    styles.root,
    {
      width: W * s,
      height: H * s,
      borderRadius: RADIUS * s,
      backgroundColor: t.fallbackBg,
    },
  ];

  if (!quote || !address) {
    const L = computeWidgetLayout(W, H, 40);
    const loadingColors =
      theme === "dark"
        ? ([LOADING_COLORS.darkBase, "#2A2631"] as const)
        : ([LOADING_COLORS.lavender, LOADING_COLORS.cream] as const);

    return (
      <View style={outerStyle}>
        <LinearGradient
          colors={loadingColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.absoluteCenter}>
          <View
            style={[
              styles.loadingCard,
              {
                width: L.cardW * s,
                padding: L.pad * s,
                borderRadius: CARD_RADIUS * s,
                backgroundColor: t.loadingCardBg,
              },
            ]}
          >
            <Image
              source={t.logo}
              style={{ width: L.logoW * s, height: L.logoH * s }}
              contentFit="contain"
            />
            <Text
              style={[
                styles.loadingTitle,
                {
                  fontSize: (L.addrFs + 1) * s,
                  color: t.text,
                  marginTop: L.gap * s,
                },
              ]}
            >
              {LOADING_COPY.title}
            </Text>
            <Text
              style={[
                styles.loadingSubtitle,
                {
                  fontSize: L.addrFs * s,
                  color: t.loadingMuted,
                  marginTop: 3 * s,
                },
              ]}
            >
              {LOADING_COPY.subtitle}
            </Text>
            <ActivityIndicator
              size="small"
              color={LOADING_COLORS.gold}
              style={{ marginTop: L.gap * s }}
            />
          </View>
        </View>
      </View>
    );
  }

  const L = computeWidgetLayout(W, H, quote.length);
  const svg = buildBackgroundSvg(W, H, dateKey, theme, RADIUS);
  const backgroundUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <View style={outerStyle}>
      <Image
        source={{ uri: backgroundUri }}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
      />

      <View style={styles.absoluteCenter}>
        <View
          style={[
            styles.card,
            {
              width: L.cardW * s,
              padding: L.pad * s,
              borderRadius: CARD_RADIUS * s,
              backgroundColor: t.cardBg,
            },
          ]}
        >
          <Image
            source={t.logo}
            style={{ width: L.logoW * s, height: L.logoH * s }}
            contentFit="contain"
          />

          <Text
            numberOfLines={L.maxLines}
            ellipsizeMode="tail"
            style={[
              styles.quote,
              {
                marginTop: L.gap * s,
                fontSize: L.fontSize * s,
                lineHeight: L.fontSize * 1.5 * s,
                color: t.text,
              },
            ]}
          >
            {quote}
          </Text>

          <View style={[styles.addressRow, { marginTop: L.gap * s }]}>
            <Text style={[styles.address, { fontSize: L.addrFs * s, color: t.text }]}>
              {address}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    alignItems: "flex-start",
  },
  quote: {
    fontFamily: "AnekMalayalam_400Regular",
    textAlign: "left",
  },
  addressRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  address: {
    fontFamily: "AnekMalayalam_400Regular",
    textAlign: "right",
  },
  loadingCard: {
    alignItems: "center",
  },
  loadingTitle: {
    fontFamily: "AnekMalayalam_400Regular",
    fontWeight: "600",
    textAlign: "center",
  },
  loadingSubtitle: {
    fontFamily: "AnekMalayalam_400Regular",
    textAlign: "center",
  },
});
