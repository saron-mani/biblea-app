import { Feather } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurTargetView, BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

/* ------------------------------------------------------------------ */
/* Random soft "heatmap hump" blur helpers                             */
/* ------------------------------------------------------------------ */

type Blob = {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  peak: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Called once per quote, so every instance gets a different pattern
const makeBlobs = (): Blob[] => {
  const count = 3 + Math.floor(Math.random() * 3); // 3–5 humps
  return Array.from({ length: count }, (_, i) => ({
    id: `b${i}_${Math.random().toString(36).slice(2, 7)}`,
    cx: rand(0, 100),
    cy: rand(0, 100),
    rx: rand(25, 60),
    ry: rand(20, 55),
    peak: rand(0.55, 1),
  }));
};

function BlurHeatmapMask({ blobs }: { blobs: Blob[] }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <Defs>
        {blobs.map((b) => (
          <RadialGradient key={b.id} id={b.id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={b.peak} />
            <Stop offset="0.5" stopColor="#000" stopOpacity={b.peak * 0.45} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {blobs.map((b) => (
        <Ellipse
          key={b.id}
          cx={b.cx}
          cy={b.cy}
          rx={b.rx}
          ry={b.ry}
          fill={`url(#${b.id})`}
        />
      ))}
    </Svg>
  );
}

function Backdrop({
  imgUrls,
  blobs,
  transition,
}: {
  imgUrls: string[];
  blobs: Blob[];
  transition?: number;
}) {
  return (
    <>
      {imgUrls[0] && (
        <Image
          source={{ uri: imgUrls[0] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={transition}
        />
      )}
      {imgUrls[1] && (
        <View style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}>
          {/* sharp base */}
          <Image
            source={{ uri: imgUrls[1] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={transition}
          />
          {/* blurred copy, revealed only inside the random humps */}
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={<BlurHeatmapMask blobs={blobs} />}
          >
            <Image
              source={{ uri: imgUrls[1] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={40}
              transition={transition}
            />
          </MaskedView>
        </View>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function QuotePage(props: {
  quote: string;
  book: string;
  chapter: number;
  verse: number;
  refresh: () => void;
  imgUrls: string[];
}) {
  const targetRef = useRef<View | null>(null);
  const shareTargetRef = useRef<View | null>(null);
  const shareViewRef = useRef<View | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  // Regenerates whenever this card gets new content (recycled list items included)
  const blobs = useMemo(makeBlobs, [props.imgUrls[1], props.quote]);

  const handleShare = async () => {
    setIsCapturing(true);

    setTimeout(async () => {
      try {
        const uri = await captureRef(shareViewRef, {
          format: "png",
          quality: 1,
        });

        const d = new Date();
        const dateString = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}_${d.getHours().toString().padStart(2, "0")}${d.getMinutes().toString().padStart(2, "0")}${d.getSeconds().toString().padStart(2, "0")}`;
        const newFileName = `biblea_${dateString}.png`;

        if (!FileSystem.cacheDirectory) {
          throw new Error("Cache directory is not available on this device");
        }

        const newPath = `${FileSystem.cacheDirectory}${newFileName}`;

        await FileSystem.copyAsync({
          from: uri,
          to: newPath,
        });

        await Sharing.shareAsync(newPath, {
          mimeType: "image/png",
          dialogTitle: "Share Quote",
          UTI: "public.png",
        });
      } catch (error) {
        console.error("Failed to capture screen", error);
      } finally {
        setIsCapturing(false);
      }
    }, 150);
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "transparent" }}
      pointerEvents="box-none"
    >
      {/* ========================================== */}
      {/* 1. HIDDEN EXPORT UI (Only renders on click) */}
      {/* ========================================== */}
      {isCapturing && (
        <View
          ref={shareViewRef}
          style={{
            position: "absolute",
            top: 0,
            left: -10000,
            width: 360,
            height: 640,
            backgroundColor: "#1a1a1a",
          }}
          collapsable={false}
          pointerEvents="none"
        >
          <BlurTargetView ref={shareTargetRef} style={StyleSheet.absoluteFill}>
            {/* No transition here so screenshot captures fully opaque instantly! */}
            <Backdrop imgUrls={props.imgUrls} blobs={blobs} />
          </BlurTargetView>

          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <BlurView
              blurTarget={shareTargetRef}
              blurMethod="dimezisBlurView"
              intensity={20}
              tint="light"
              style={{
                width: 306,
                paddingHorizontal: 24,
                paddingVertical: 32,
                borderRadius: 15,
                overflow: "hidden",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              <Image
                source={require("../../assets/images/name-img.svg")}
                style={{ width: 150, height: 100, marginBottom: 16 }}
                contentFit="contain"
              />

              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "AnekMalayalam_400Regular",
                  marginBottom: 24,
                  lineHeight: 26,
                }}
              >
                {props.quote}
              </Text>

              <Text
                style={{
                  fontSize: 17,
                  alignSelf: "flex-end",
                  fontFamily: "AnekMalayalam_400Regular",
                  fontStyle: "italic",
                  paddingRight: 6,
                }}
              >
                {props.book + " " + props.chapter + ":" + props.verse}
              </Text>
            </BlurView>
          </View>
        </View>
      )}

      {/* ========================================== */}
      {/* 2. VISIBLE UI (What the user actually sees) */}
      {/* ========================================== */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "transparent", zIndex: 1 },
        ]}
        pointerEvents="box-none"
      >
        <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
          {/* Visible UI keeps its smooth fade-in */}
          <Backdrop imgUrls={props.imgUrls} blobs={blobs} transition={800} />
        </BlurTargetView>

        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          pointerEvents="box-none"
        >
          <BlurView
            blurTarget={targetRef}
            blurMethod="dimezisBlurView"
            intensity={20}
            tint="light"
            style={{
              width: "85%",
              maxWidth: 450,
              paddingHorizontal: 24,
              paddingVertical: 32,
              borderRadius: 15,
              overflow: "hidden",
              boxShadow: "0px 4px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Image
              source={require("../../assets/images/name-img.svg")}
              style={{ width: 150, height: 100, marginBottom: 16 }}
              contentFit="contain"
            />

            <Text
              style={{
                fontSize: 18,
                fontFamily: "AnekMalayalam_400Regular",
                marginBottom: 24,
                lineHeight: 26,
              }}
            >
              {props.quote}
            </Text>

            <Text
              style={{
                fontSize: 17,
                alignSelf: "flex-end",
                fontFamily: "AnekMalayalam_400Regular",
                fontStyle: "italic",
                marginBottom: 16,
                paddingRight: 6,
              }}
            >
              {props.book + " " + props.chapter + ":" + props.verse}
            </Text>

            <TouchableOpacity
              onPress={handleShare}
              disabled={isCapturing}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: "rgba(255, 255, 255, 0.2)",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "flex-start",
                marginTop: 10,
              }}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
              ) : (
                <Feather
                  name="share-2"
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              )}
            </TouchableOpacity>

            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: "#ffffff35",
                width: "75%",
                marginTop: 24,
                marginBottom: 2,
                alignSelf: "flex-start",
              }}
            />
          </BlurView>
        </View>
      </View>
    </View>
  );
}
