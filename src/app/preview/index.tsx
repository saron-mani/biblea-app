import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PLACEHOLDER_VERSE } from "@/components/placeholderVerse";
import QuotePage from "@/components/QuotePage";
import WidgetPreview, {
  type WidgetPreviewTheme,
} from "@/components/WidgetPreview";
import { getVerse } from "../../components/quoteRepository";
import {
  formatAddress,
  getBookName,
  parseBibleAddress,
} from "../../utils/bibleAddress";

const SAMPLE_QUOTE: string = PLACEHOLDER_VERSE.text;
const SAMPLE_ADDRESS: { book: string; chapter: string; verse: string } = {
  book: PLACEHOLDER_VERSE.book,
  chapter: PLACEHOLDER_VERSE.chapter,
  verse: PLACEHOLDER_VERSE.verse,
};

const makeImages = (seed = "biblea-preview") => ({
  a: `https://picsum.photos/seed/${seed}-a/720/1280.webp`,
  b: `https://picsum.photos/seed/${seed}-b/540/960.webp`,
});

type PreviewMode = "app" | "widget";

interface Status {
  text: string;
  error: boolean;
}

function PillButton({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function PreviewPage() {
  const params = useLocalSearchParams<{ address?: string }>();
  const addressParam = Array.isArray(params.address)
    ? params.address[0]
    : params.address;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<PreviewMode>("app");
  const [widgetTheme, setWidgetTheme] = useState<WidgetPreviewTheme>("light");
  const [dateKey, setDateKey] = useState("2026-11-19");

  const [quote, setQuote] = useState(SAMPLE_QUOTE);
  const [book, setBook] = useState(SAMPLE_ADDRESS.book);
  const [chapter, setChapter] = useState(SAMPLE_ADDRESS.chapter);
  const [verse, setVerse] = useState(SAMPLE_ADDRESS.verse);

  const images = useCallback(() => makeImages(), []);
  const [imageA, setImageA] = useState(images().a);
  const [imageB, setImageB] = useState(images().b);

  const [addressInput, setAddressInput] = useState(
    addressParam ?? "ulpathi 1:1",
  );
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const lookupAddress = useCallback(async (value: string) => {
    const parsed = parseBibleAddress(value);
    if (!parsed.ok) {
      setStatus({ text: parsed.error, error: true });
      return;
    }

    setLoading(true);
    try {
      const text = await getVerse(
        parsed.value.book,
        parsed.value.chapter,
        parsed.value.verse,
      );
      if (!text) {
        setStatus({
          text: `No quote found in the bank for ${parsed.value.formatted}.`,
          error: true,
        });
        return;
      }

      setQuote(text);
      setBook(parsed.value.book);
      setChapter(parsed.value.chapter);
      setVerse(parsed.value.verse);
      setStatus({
        text: `Loaded ${parsed.value.bookName} ${parsed.value.chapter}:${parsed.value.verse} → ${parsed.value.formatted}`,
        error: false,
      });
    } catch (error) {
      setStatus({
        text: `Lookup failed: ${error instanceof Error ? error.message : String(error)}`,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!addressParam) return;
    // Defer to a microtask so query-param changes never trigger a synchronous
    // state update from inside the effect body.
    void Promise.resolve().then(() => lookupAddress(addressParam));
  }, [addressParam, lookupAddress]);

  const randomizeImages = useCallback(() => {
    const next = makeImages(Math.random().toString(36).slice(2, 10));
    setImageA(next.a);
    setImageB(next.b);
  }, []);

  const chapterNumber = Math.max(1, parseInt(chapter, 10) || 1);
  const verseNumber = Math.max(1, parseInt(verse, 10) || 1);
  const reference = `${getBookName(book)} ${chapterNumber}:${verseNumber}`;
  const addressKey = formatAddress({ book, chapter, verse });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>biblea preview</Text>
          <Text style={styles.subtitle}>
            Test quotes, backgrounds and the home-screen widget.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Link href="/preview/convert" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Text style={styles.headerButtonText}>Address converter</Text>
            </Pressable>
          </Link>

          <Pressable
            onPress={() => setSettingsOpen((open) => !open)}
            style={({ pressed }) => [
              styles.headerButton,
              styles.primaryButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <Text style={[styles.headerButtonText, styles.primaryButtonText]}>
              {settingsOpen ? "Hide settings" : "Settings"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewArea}>
        <Text style={styles.modeLabel}>
          {mode === "widget" ? "Widget preview" : "App card preview"}
        </Text>

        {mode === "widget" ? (
          <WidgetPreview
            quote={quote}
            address={reference}
            dateKey={dateKey}
            theme={widgetTheme}
            scale={1.7}
          />
        ) : (
          <View style={styles.appFrame}>
            <QuotePage
              quote={quote}
              book={getBookName(book)}
              chapter={chapterNumber}
              verse={verseNumber}
              imgUrls={[imageA, imageB]}
            />
          </View>
        )}

        <Text style={styles.addressKey}>Address key: {addressKey}</Text>
      </View>

      {settingsOpen ? (
        <View style={styles.settings}>
          <Text style={styles.settingsTitle}>Preview settings</Text>

          <Text style={styles.label}>Mode</Text>
          <View style={styles.row}>
            <PillButton
              label="App card"
              active={mode === "app"}
              onPress={() => setMode("app")}
            />
            <PillButton
              label="Widget"
              active={mode === "widget"}
              onPress={() => setMode("widget")}
            />
          </View>

          {mode === "widget" ? (
            <>
              <Text style={styles.label}>Widget theme</Text>
              <View style={styles.row}>
                <PillButton
                  label="Light"
                  active={widgetTheme === "light"}
                  onPress={() => setWidgetTheme("light")}
                />
                <PillButton
                  label="Dark"
                  active={widgetTheme === "dark"}
                  onPress={() => setWidgetTheme("dark")}
                />
              </View>

              <Text style={styles.label}>Background date key</Text>
              <TextInput
                style={styles.input}
                value={dateKey}
                onChangeText={setDateKey}
                placeholder="2026-11-19"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                The widget background is chosen deterministically from this key.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Background image A</Text>
              <TextInput
                style={styles.input}
                value={imageA}
                onChangeText={setImageA}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Background image B</Text>
              <TextInput
                style={styles.input}
                value={imageB}
                onChangeText={setImageB}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable onPress={randomizeImages} style={styles.wideButton}>
                <Text style={styles.wideButtonText}>Randomize backgrounds</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.label}>Quote text</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={quote}
            onChangeText={setQuote}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Reference</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={book}
              onChangeText={setBook}
              placeholder="book"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={chapter}
              onChangeText={setChapter}
              placeholder="chapter"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={verse}
              onChangeText={setVerse}
              placeholder="verse"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Get quote from address</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.growInput]}
              value={addressInput}
              onChangeText={setAddressInput}
              placeholder="ulpathi 1:1 or 0:1:1"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => void lookupAddress(addressInput)}
            />
            <Pressable
              onPress={() => void lookupAddress(addressInput)}
              disabled={loading}
              style={styles.wideButtonCompact}
            >
              <Text style={styles.compactButtonText}>
                {loading ? "Loading…" : "Load"}
              </Text>
            </Pressable>
          </View>

          {status ? (
            <Text
              style={[styles.status, status.error && styles.statusError]}
            >
              {status.text}
            </Text>
          ) : null}

          <Link href="/preview/convert" asChild>
            <Pressable style={styles.wideButton}>
              <Text style={styles.wideButtonText}>
                Open address converter →
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f3f8",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    width: "100%",
    maxWidth: 1000,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17181c",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#66636e",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ded9e7",
  },
  primaryButton: {
    backgroundColor: "#17181c",
    borderColor: "#17181c",
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17181c",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  previewArea: {
    alignItems: "center",
    gap: 12,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#77737f",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  appFrame: {
    width: 360,
    height: 640,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  addressKey: {
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 14,
    color: "#66636e",
  },
  settings: {
    width: "100%",
    maxWidth: 720,
    marginTop: 28,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e3ed",
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17181c",
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a4652",
    marginTop: 16,
    marginBottom: 7,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#8a8692",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#f0edf4",
    borderWidth: 1,
    borderColor: "#ded9e7",
  },
  pillActive: {
    backgroundColor: "#17181c",
    borderColor: "#17181c",
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#17181c",
  },
  pillTextActive: {
    color: "#ffffff",
  },
  input: {
    flexGrow: 1,
    minWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded9e7",
    backgroundColor: "#fbfafc",
    color: "#17181c",
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 14,
  },
  multiline: {
    minHeight: 100,
  },
  smallInput: {
    width: 90,
    flexGrow: 0,
  },
  growInput: {
    flexGrow: 1,
  },
  wideButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#efeaf5",
    alignItems: "center",
  },
  wideButtonCompact: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#17181c",
    alignItems: "center",
  },
  wideButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#17181c",
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  status: {
    marginTop: 12,
    fontSize: 13,
    color: "#2f7a4f",
  },
  statusError: {
    color: "#b42318",
  },
});
