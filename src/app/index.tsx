import QuotePage from "@/components/QuotePage";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";

import { useBibleQuoteCache } from "../components/useBibleQuoteCache";
import QuoteAddress from "../quoteAddress.json";
import QuoteBank from "../quoteBank.json";

const malayalamBooks: Record<string, string> = {
  "0": "ഉല്പത്തി",
  "1": "പുറപ്പാട്",
  "2": "ലേവ്യർ",
  "3": "സംഖ്യ",
  "4": "നിയമാവർത്തനം",
  "5": "ജോഷ്വാ",
  "6": "ന്യായാധിപന്മാർ",
  "7": "റൂത്ത്",
  "8": "1 സാമുവൽ",
  "9": "2 സാമുവൽ",
  "10": "1 രാജാക്കന്മാർ",
  "11": "2 രാജാക്കന്മാർ",
  "12": "1 ദിനവൃത്താന്തം",
  "13": "2 ദിനവൃത്താന്തം",
  "14": "എസ്രാ",
  "15": "നെഹെമിയ",
  "16": "എസ്തേർ",
  "17": "ജോബ്",
  "18": "സങ്കീർത്തനങ്ങൾ",
  "19": "സുഭാഷിതങ്ങൾ",
  "20": "സഭാപ്രസംഗകൻ",
  "21": "ഉത്തമഗീതം",
  "22": "ഏശയ്യാ",
  "23": "ജെറെമിയാ",
  "24": "വിലാപങ്ങൾ",
  "25": "എസെക്കിയേൽ",
  "26": "ദാനിയേൽ",
  "27": "ഹോസിയാ",
  "28": "ജോയേൽ",
  "29": "ആമോസ്",
  "30": "ഒബാദിയാ",
  "31": "യോനാ",
  "32": "മീഖാ",
  "33": "നാഹും",
  "34": "ഹബക്കുക്ക്",
  "35": "സെഫാനിയാ",
  "36": "ഹഗ്ഗായി",
  "37": "സഖറിയാ",
  "38": "മലാക്കി",
  "39": "മത്തായി",
  "40": "മർക്കോസ്",
  "41": "ലൂക്കാ",
  "42": "യോഹന്നാൻ",
  "43": "അപ്പസ്തോലന്മാരുടെ പ്രവർത്തനങ്ങൾ",
  "44": "റോമാ",
  "45": "1 കോറിന്തോസ്",
  "46": "2 കോറിന്തോസ്",
  "47": "ഗലാത്തിയാ",
  "48": "എഫേസോസ്",
  "49": "ഫിലിപ്പി",
  "50": "കൊളോസോസ്",
  "51": "1 തെസ്സലോനിക്കാ",
  "52": "2 തെസ്സലോനിക്കാ",
  "53": "1 തിമോത്തേയോസ്",
  "54": "2 തിമോത്തേയോസ്",
  "55": "തീത്തോസ്",
  "56": "ഫിലേമോൻ",
  "57": "ഹെബ്രായർ",
  "58": "യാക്കോബ്",
  "59": "1 പത്രോസ്",
  "60": "2 പത്രോസ്",
  "61": "1 യോഹന്നാൻ",
  "62": "2 യോഹന്നാൻ",
  "63": "3 യോഹന്നാൻ",
  "64": "യൂദാ",
  "65": "വെളിപാട്",
};

interface QuoteData {
  topic: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

interface FeedItem extends QuoteData {
  id: string;
  imageA: string;
  imageB: string;
}

type AddressTopicMap = Record<
  string,
  { book: string; chapter: string; verse: string }[]
>;

const typedQuoteAddress = QuoteAddress.topics as AddressTopicMap;

function getRandomQuote(): QuoteData {
  const topics = Object.keys(typedQuoteAddress);

  if (topics.length === 0) {
    return {
      topic: "Error",
      book: "0",
      chapter: "0",
      verse: "0",
      text: "No topics found.",
    };
  }

  let quoteText: string | undefined = undefined;
  let selectedTopic = "";
  let selectedBook = "0";
  let selectedChapter = "0";
  let selectedVerse = "0";

  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  while (!quoteText && attempts < MAX_ATTEMPTS) {
    selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    const addresses = typedQuoteAddress[selectedTopic];

    if (addresses && addresses.length > 0) {
      const randomAddress =
        addresses[Math.floor(Math.random() * addresses.length)];
      selectedBook = randomAddress.book;
      selectedChapter = randomAddress.chapter;
      selectedVerse = randomAddress.verse;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quoteText = (QuoteBank as any)[selectedBook]?.[selectedChapter]?.[
        selectedVerse
      ];
    }
    attempts++;
  }

  if (!quoteText) {
    return {
      topic: "Error",
      book: "0",
      chapter: "0",
      verse: "0",
      text: "Quote database unavailable.",
    };
  }

  return {
    topic: selectedTopic,
    book: selectedBook,
    chapter: selectedChapter,
    verse: selectedVerse,
    text: quoteText,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDailyQuote(currentDayData: any): QuoteData | null {
  if (!currentDayData) return null;
  const { book, chapter, verse } = currentDayData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (QuoteBank as any)[book]?.[chapter]?.[verse];
  if (!text) return null;
  return { topic: "daily", book, chapter, verse, text };
}

const FeedItemWrapper = React.memo(
  ({
    item,
    containerHeight,
    scrollToNext,
    localizedBookName,
  }: {
    item: FeedItem;
    containerHeight: number;
    scrollToNext: () => void;
    localizedBookName: string;
  }) => {
    return (
      <View style={{ height: containerHeight, backgroundColor: "#000000" }}>
        <View style={{ flex: 1 }}>
          <QuotePage
            quote={item.text}
            book={localizedBookName}
            chapter={parseInt(item.chapter, 10)}
            verse={parseInt(item.verse, 10)}
            imgUrls={[item.imageA, item.imageB]}
            refresh={scrollToNext}
          />
        </View>
      </View>
    );
  },
);

export default function Index() {
  const {
    currentDayData,
    loading: cacheLoading,
    missingForToday,
  } = useBibleQuoteCache();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const flatListRef = useRef<FlatList>(null);

  const isFetchingMore = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);
  const feedLengthRef = useRef<number>(0);

  useEffect(() => {
    feedLengthRef.current = feed.length;
  }, [feed]);

  const generateAndCacheItems = async (count: number): Promise<FeedItem[]> => {
    const newItems: FeedItem[] = [];
    const urlsToPrefetch: string[] = [];

    for (let i = 0; i < count; i++) {
      const quote = getRandomQuote();
      const url1 = `https://picsum.photos/720/1280.webp?random=${Math.random()}`;
      const url2 = `https://picsum.photos/540/960.webp?random=${Math.random()}`;

      newItems.push({
        ...quote,
        id: Math.random().toString(36).substring(2, 11),
        imageA: url1,
        imageB: url2,
      });
      urlsToPrefetch.push(url1, url2);
    }

    try {
      await Promise.allSettled(
        urlsToPrefetch.map((url) => ExpoImage.prefetch(url)),
      );
    } catch (error) {
      console.warn("Prefetch error:", error);
    }

    return newItems;
  };

  const fetchMoreData = async (count: number) => {
    if (isFetchingMore.current) return;
    isFetchingMore.current = true;

    const newItems = await generateAndCacheItems(count);
    setFeed((prev) => [...prev, ...newItems]);

    isFetchingMore.current = false;
  };

  useEffect(() => {
    if (initialized || cacheLoading) return;

    const setupInitialFeed = async () => {
      // Prevent infinite scroll storage leak!
      await ExpoImage.clearDiskCache();
      await ExpoImage.clearMemoryCache();

      const dailyQuote = missingForToday
        ? null
        : resolveDailyQuote(currentDayData);
      const initialItems: FeedItem[] = [];

      if (dailyQuote && currentDayData) {
        initialItems.push({
          ...dailyQuote,
          id: "daily-quote",
          imageA: currentDayData.imageA,
          imageB: currentDayData.imageB,
        });
      } else {
        const [randomFirstItem] = await generateAndCacheItems(1);
        initialItems.push(randomFirstItem);
      }

      const [cachedNextItem] = await generateAndCacheItems(1);
      initialItems.push(cachedNextItem);

      setFeed(initialItems);
      setIsLoading(false);
      setInitialized(true);
    };

    setupInitialFeed();
  }, [cacheLoading, currentDayData, missingForToday, initialized]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      currentIndexRef.current = viewableItems[0].index;
    }
  }).current;

  const scrollToNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (flatListRef.current && nextIndex < feedLengthRef.current) {
      flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
    }
  }, []);

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      const localizedBookName = malayalamBooks[item.book] || item.book;
      return (
        <FeedItemWrapper
          item={item}
          containerHeight={containerHeight}
          scrollToNext={scrollToNext}
          localizedBookName={localizedBookName}
        />
      );
    },
    [containerHeight, scrollToNext],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {isLoading || feed.length === 0 || containerHeight === 0 ? (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feed}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          windowSize={3}
          maxToRenderPerBatch={2}
          onEndReached={() => fetchMoreData(3)}
          onEndReachedThreshold={0.5}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    zIndex: 10,
  },
});
