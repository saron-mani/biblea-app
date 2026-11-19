import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Ellipse } from "react-native-svg";

import { LOADING_COLORS, LOADING_COPY } from "./loadingTheme";

const LOGO = require("../../assets/images/name-img.svg");

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  showSpinner?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Warm, branded loading surface used while the first real quote resolves. */
export default function LoadingState({
  title = LOADING_COPY.title,
  subtitle = LOADING_COPY.subtitle,
  showSpinner = true,
  style,
}: LoadingStateProps) {
  return (
    <LinearGradient
      colors={[LOADING_COLORS.lavender, LOADING_COLORS.cream]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.root, style]}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Ellipse cx="12" cy="10" rx="34" ry="30" fill={LOADING_COLORS.lilac} fillOpacity={0.28} />
        <Ellipse cx="94" cy="88" rx="38" ry="34" fill={LOADING_COLORS.peach} fillOpacity={0.32} />
        <Ellipse cx="86" cy="12" rx="12" ry="12" fill={LOADING_COLORS.gold} fillOpacity={0.18} />
      </Svg>

      <View style={styles.card}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {showSpinner ? (
          <ActivityIndicator
            size="small"
            color={LOADING_COLORS.gold}
            style={styles.spinner}
          />
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: LOADING_COLORS.card,
    borderWidth: 1,
    borderColor: LOADING_COLORS.cardBorder,
    shadowColor: "#5B4B7A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5,
  },
  logo: {
    width: 104,
    height: 36,
  },
  title: {
    marginTop: 18,
    color: LOADING_COLORS.ink,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: LOADING_COLORS.muted,
    fontSize: 13,
    textAlign: "center",
  },
  spinner: {
    marginTop: 18,
  },
});
