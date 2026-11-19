import { Feather } from "@expo/vector-icons";
import { BlurTargetView, BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import QuoteBackground, { createSoftBlobs } from "./QuoteBackground";

const BIBLEA_URL = "https://biblea.web.app/";

export interface QuotePageProps {
  quote: string;
  book: string;
  chapter: number;
  verse: number;
  imgUrls: string[];
}

function QuoteCardSurface({
  quote,
  reference,
  targetRef,
  exportMode = false,
  isCapturing = false,
  onShare,
  onOpenWebsite,
}: {
  quote: string;
  reference: string;
  targetRef: React.RefObject<View | null>;
  exportMode?: boolean;
  isCapturing?: boolean;
  onShare?: () => void;
  onOpenWebsite?: () => void;
}) {
  return (
    <View style={styles.cardContainer} pointerEvents="box-none">
      <BlurView
        blurTarget={targetRef}
        blurMethod="dimezisBlurViewSdk31Plus"
        intensity={20}
        tint="light"
        style={[
          styles.card,
          exportMode ? styles.exportCard : styles.visibleCard,
        ]}
      >
        <View style={styles.divider} />
        <Text style={styles.quote}>{quote}</Text>
        <Text
          style={[styles.reference, !exportMode && styles.referenceWithShare]}
        >
          {reference}
        </Text>

        {!exportMode ? (
          <>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={onOpenWebsite}
                disabled={!onOpenWebsite}
                style={styles.circleButton}
                accessibilityRole="link"
                accessibilityLabel="Open Biblea website"
              >
                <Image
                  source={require("../../assets/images/biblea-adaptive-icon.png")}
                  style={styles.brandIcon}
                  contentFit="cover"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onShare}
                disabled={isCapturing || !onShare}
                style={styles.circleButton}
                accessibilityRole="button"
                accessibilityLabel="Share quote"
              >
                {isCapturing ? (
                  <ActivityIndicator
                    size="small"
                    color="rgba(255,255,255,0.6)"
                  />
                ) : (
                  <Feather
                    name="share-2"
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </BlurView>
    </View>
  );
}

export default function QuotePage(props: QuotePageProps) {
  const targetRef = useRef<View | null>(null);
  const shareTargetRef = useRef<View | null>(null);
  const shareViewRef = useRef<View | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [isCapturing, setIsCapturing] = useState(false);

  const secondaryImageUrl = props.imgUrls[1];
  const blobs = useMemo(
    () => createSoftBlobs(`${secondaryImageUrl}|${props.quote}`),
    [secondaryImageUrl, props.quote],
  );
  const reference = `${props.book} ${props.chapter}:${props.verse}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (shareTimer.current) clearTimeout(shareTimer.current);
    };
  }, []);

  const handleOpenWebsite = useCallback(async () => {
    try {
      await Linking.openURL(BIBLEA_URL);
    } catch (error) {
      console.error("Failed to open website", error);
    }
  }, []);

  const handleShare = useCallback(async () => {
    setIsCapturing(true);

    shareTimer.current = setTimeout(async () => {
      try {
        const uri = await captureRef(shareViewRef, {
          format: "png",
          quality: 1,
        });

        if (!mountedRef.current) return;

        if (!FileSystem.cacheDirectory) {
          throw new Error("Cache directory is not available on this device");
        }

        const d = new Date();
        const pad = (value: number) => String(value).padStart(2, "0");
        const dateString = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        const newPath = `${FileSystem.cacheDirectory}biblea_${dateString}.png`;

        await FileSystem.copyAsync({ from: uri, to: newPath });

        await Sharing.shareAsync(newPath, {
          mimeType: "image/png",
          dialogTitle: "Share Quote",
          UTI: "public.png",
        });
      } catch (error) {
        console.error("Failed to capture screen", error);
      } finally {
        if (mountedRef.current) setIsCapturing(false);
      }
    }, 150);
  }, []);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {isCapturing ? (
        <View
          ref={shareViewRef}
          style={styles.exportRoot}
          collapsable={false}
          pointerEvents="none"
        >
          <BlurTargetView ref={shareTargetRef} style={StyleSheet.absoluteFill}>
            <QuoteBackground
              primaryUri={props.imgUrls[0]}
              secondaryUri={secondaryImageUrl}
              blobs={blobs}
            />
          </BlurTargetView>

          <QuoteCardSurface
            quote={props.quote}
            reference={reference}
            targetRef={shareTargetRef}
            exportMode
          />
        </View>
      ) : null}

      <View style={styles.visibleLayer} pointerEvents="box-none">
        <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
          <QuoteBackground
            primaryUri={props.imgUrls[0]}
            secondaryUri={secondaryImageUrl}
            blobs={blobs}
            transition={800}
          />
        </BlurTargetView>

        <QuoteCardSurface
          quote={props.quote}
          reference={reference}
          targetRef={targetRef}
          isCapturing={isCapturing}
          onShare={handleShare}
          onOpenWebsite={handleOpenWebsite}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  exportRoot: {
    position: "absolute",
    top: 0,
    left: -10000,
    width: 360,
    height: 640,
    backgroundColor: "#1a1a1a",
  },
  visibleLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 15,
    overflow: "hidden",
  },
  visibleCard: {
    width: "85%",
    maxWidth: 450,
    boxShadow: "0px 4px 50px rgba(0, 0, 0, 0.2)",
  },
  exportCard: {
    width: 306,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  quote: {
    fontSize: 18,
    fontFamily: "AnekMalayalam_400Regular",
    marginBottom: 24,
    lineHeight: 26,
  },
  reference: {
    fontSize: 17,
    alignSelf: "flex-end",
    fontFamily: "AnekMalayalam_400Regular",
    fontStyle: "italic",
    paddingRight: 6,
  },
  referenceWithShare: {
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
    marginTop: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  brandIcon: {
    width: "60%",
    height: "60%",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ffffff35",
    width: "100%",
    marginTop: 2,
    marginBottom: 24,
    alignSelf: "flex-start",
  },
});
