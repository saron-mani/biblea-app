import { Feather } from "@expo/vector-icons";
import { BlurTargetView, BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

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
            {props.imgUrls[0] && (
              <Image
                source={{ uri: props.imgUrls[0] }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                // No transition here so screenshot captures fully opaque instantly!
              />
            )}
            {props.imgUrls[1] && (
              <Image
                source={{ uri: props.imgUrls[1] }}
                style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
                contentFit="cover"
              />
            )}
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
          {props.imgUrls[0] && (
            <Image
              source={{ uri: props.imgUrls[0] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={800} // Visible UI keeps its smooth fade-in
            />
          )}
          {props.imgUrls[1] && (
            <Image
              source={{ uri: props.imgUrls[1] }}
              style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
              contentFit="cover"
              transition={800}
            />
          )}
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
