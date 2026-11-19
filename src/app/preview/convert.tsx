import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getVerse } from "../../components/quoteRepository";
import {
  type ParsedBibleAddress,
  parseBibleAddress,
} from "../../utils/bibleAddress";

const EXAMPLES = [
  "ulpathi 1:1",
  "ഉല്പത്തി 1 : 1",
  "yohannan 3:16",
  "1 John 4:8",
  "0:1:1",
];

export default function ConvertAddressPage() {
  const router = useRouter();
  const [input, setInput] = useState("ulpathi 1 : 1");
  const [result, setResult] = useState<ParsedBibleAddress | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const convert = useCallback(async (value: string) => {
    const parsed = parseBibleAddress(value);
    if (!parsed.ok) {
      setResult(null);
      setQuote(null);
      setError(parsed.error);
      return;
    }

    setError(null);
    setResult(parsed.value);
    setLoading(true);
    try {
      setQuote(
        await getVerse(
          parsed.value.book,
          parsed.value.chapter,
          parsed.value.verse,
        ),
      );
    } catch (err) {
      setQuote(null);
      setError(
        `Address converted, but the quote lookup failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const useInPreview = useCallback(() => {
    if (!result) return;
    router.push({
      pathname: "/preview",
      params: { address: result.formatted },
    });
  }, [result, router]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href="/preview" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Back to preview</Text>
        </Pressable>
      </Link>

      <Text style={styles.title}>Address converter</Text>
      <Text style={styles.subtitle}>
        Converts a readable Bible reference into the numeric address-bank key
        used by <Text style={styles.code}>quoteBank.json</Text>.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Bible address</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="ulpathi 1:1 or 0:1:1"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => void convert(input)}
        />

        <Pressable onPress={() => void convert(input)} style={styles.button}>
          <Text style={styles.buttonText}>Convert</Text>
        </Pressable>

        <Text style={styles.label}>Try an example</Text>
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <Pressable
              key={example}
              onPress={() => {
                setInput(example);
                void convert(example);
              }}
              style={({ pressed }) => [
                styles.example,
                pressed && styles.examplePressed,
              ]}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Address-bank format</Text>
          <Text style={styles.resultValue}>{result.formatted}</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Book</Text>
            <Text style={styles.resultText}>
              {result.book} — {result.bookName}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Chapter</Text>
            <Text style={styles.resultText}>{result.chapter}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Verse</Text>
            <Text style={styles.resultText}>{result.verse}</Text>
          </View>

          <Text style={styles.resultLabel}>Quote in bank</Text>
          <Text style={styles.quote}>
            {loading
              ? "Loading quote…"
              : quote ?? "No quote found for this address."}
          </Text>

          <Pressable onPress={useInPreview} style={styles.button}>
            <Text style={styles.buttonText}>Use in preview →</Text>
          </Pressable>
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5b5665",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17181c",
    alignSelf: "flex-start",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 21,
    color: "#6b6673",
    alignSelf: "flex-start",
  },
  code: {
    fontFamily: "monospace",
    fontSize: 13,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e3ed",
  },
  label: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#4a4652",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded9e7",
    backgroundColor: "#fbfafc",
    color: "#17181c",
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 16,
  },
  button: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#17181c",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  example: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f0edf4",
    borderWidth: 1,
    borderColor: "#ded9e7",
  },
  examplePressed: {
    opacity: 0.6,
  },
  exampleText: {
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 13,
    color: "#17181c",
  },
  error: {
    width: "100%",
    maxWidth: 640,
    marginTop: 14,
    fontSize: 13,
    color: "#b42318",
  },
  resultCard: {
    width: "100%",
    maxWidth: 640,
    marginTop: 20,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8cfe6",
  },
  resultLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#8a8692",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#4a2f82",
    fontFamily: "monospace",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0edf4",
  },
  resultKey: {
    fontSize: 13,
    color: "#8a8692",
  },
  resultText: {
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 14,
    color: "#17181c",
  },
  quote: {
    marginBottom: 8,
    fontFamily: "AnekMalayalam_400Regular",
    fontSize: 17,
    lineHeight: 27,
    color: "#17181c",
  },
});
