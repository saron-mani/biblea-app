// src/widgets/widget-task-handler.tsx
//
// Android calls this (in a headless JS context, app closed) whenever the
// widget is added, resized, or its updatePeriodMillis timer fires.
// It shares the same Google Sheets cache + daily rollover as the app, looks
// the verse up through the bundled SQLite repository, and generates the
// background from the date (see backgrounds.ts) without downloading images.
//
// The first render uses the bundled 0:1:1 verse so a widget never sits on the
// native loading layout longer than it takes JS to start. The correct verse
// replaces it as soon as the lookup finishes.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  requestWidgetUpdate,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget";

// NOTE: this file lives in src/widgets, so ".." is src/.
import { getCurrentDayData, todayKey } from "../components/bibleQuoteService";
import { PLACEHOLDER_VERSE } from "../components/placeholderVerse";
import { getVerse } from "../components/quoteRepository";
import { malayalamBooks } from "../malayalamBooks";
import { QuoteWidget } from "./QuoteWidget";
import { MIN_WIDGET_HEIGHT_DP, MIN_WIDGET_WIDTH_DP } from "./widgetLayout";

/** Must match widgets[].name in the app.json plugin config. */
export const WIDGET_NAME = "DailyQuote";

const PORTRAIT_SIZE_PREFIX = "biblea:widget:portrait-size:";
const DEFAULT_PORTRAIT_WIDTH = 250;
const DEFAULT_PORTRAIT_HEIGHT = 180;
const MAX_PORTRAIT_ASPECT_RATIO = 2.2;

export interface WidgetQuoteData {
  book: string;
  chapter: string;
  verse: string;
}

interface WidgetRenderData {
  quote: string;
  address: string;
}

interface WidgetSize {
  width: number;
  height: number;
}

function isSanePortraitSize(
  size: Partial<WidgetSize> | null | undefined,
): size is WidgetSize {
  if (!size) return false;
  const width = Number(size.width);
  const height = Number(size.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  if (width < MIN_WIDGET_WIDTH_DP || height < MIN_WIDGET_HEIGHT_DP) return false;
  // A landscape/background-collapsed update reports a very wide, short frame.
  if (width / height > MAX_PORTRAIT_ASPECT_RATIO) return false;
  return true;
}

function sizeKey(widgetId: number): string {
  return `${PORTRAIT_SIZE_PREFIX}${widgetId}`;
}

async function readStoredPortraitSize(
  widgetId: number,
): Promise<WidgetSize | null> {
  try {
    const raw = await AsyncStorage.getItem(sizeKey(widgetId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WidgetSize>;
    return isSanePortraitSize(parsed) ? { width: parsed.width, height: parsed.height } : null;
  } catch {
    return null;
  }
}

async function storePortraitSize(widgetId: number, size: WidgetSize): Promise<void> {
  try {
    await AsyncStorage.setItem(sizeKey(widgetId), JSON.stringify(size));
  } catch {
    // Size persistence is best-effort; rendering must still proceed.
  }
}

async function resolveEffectiveSize(
  widgetId: number,
  incoming: Partial<WidgetSize> | null | undefined,
  options: { allowStore: boolean; skipIfInvalid: boolean },
): Promise<WidgetSize | null> {
  const incomingSize = isSanePortraitSize(incoming)
    ? { width: incoming.width, height: incoming.height }
    : null;

  if (incomingSize && options.allowStore) {
    await storePortraitSize(widgetId, incomingSize);
    return incomingSize;
  }

  const stored = await readStoredPortraitSize(widgetId);
  if (incomingSize) return incomingSize;
  if (stored) return stored;

  if (options.skipIfInvalid) return null;
  return { width: DEFAULT_PORTRAIT_WIDTH, height: DEFAULT_PORTRAIT_HEIGHT };
}

function createWidgetRepresentation(
  data: WidgetRenderData | null,
  width: number,
  height: number,
) {
  const shared = {
    quote: data?.quote ?? PLACEHOLDER_VERSE.text,
    address: data?.address ?? PLACEHOLDER_VERSE.address,
    dateKey: todayKey(),
    width,
    height,
  };

  // Android picks the light or dark version itself when the system theme
  // changes, so no JS has to run at the moment the theme switches.
  return {
    light: <QuoteWidget {...shared} theme="light" />,
    dark: <QuoteWidget {...shared} theme="dark" />,
  };
}

type WidgetRepresentation = ReturnType<typeof createWidgetRepresentation>;

async function loadWidgetData(): Promise<WidgetRenderData | null> {
  // Widget renders don't display the daily images, so skip all image-cache
  // work (including prefetch) in this headless path.
  const { currentDayData } = await getCurrentDayData({ includeImages: false });
  if (!currentDayData) return null; // sheet has no row for today

  const { book, chapter, verse } = currentDayData;
  const quote = await getVerse(book, chapter, verse);
  if (!quote) return null;

  const bookName = malayalamBooks[book] || book;
  const address = `${bookName} ${parseInt(chapter, 10)}:${parseInt(verse, 10)}`;

  return { quote, address };
}

async function buildWidget(
  width = DEFAULT_PORTRAIT_WIDTH,
  height = DEFAULT_PORTRAIT_HEIGHT,
  prepared?: WidgetQuoteData | null,
  onPlaceholder?: (representation: WidgetRepresentation) => void,
): Promise<WidgetRepresentation> {
  // Paint 0:1:1 before any async work so the widget is never blank.
  onPlaceholder?.(createWidgetRepresentation(null, width, height));

  let data: WidgetRenderData | null = null;

  if (prepared) {
    const quote = await getVerse(prepared.book, prepared.chapter, prepared.verse);
    if (quote) {
      const bookName = malayalamBooks[prepared.book] || prepared.book;
      data = {
        quote,
        address: `${bookName} ${parseInt(prepared.chapter, 10)}:${parseInt(
          prepared.verse,
          10,
        )}`,
      };
    }
  } else {
    try {
      data = await loadWidgetData();
    } catch (err) {
      console.log("[biblea] widget: loading today's data failed", err);
    }
  }

  return createWidgetRepresentation(data, width, height);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  if (widgetInfo.widgetName !== WIDGET_NAME) return;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_RESIZED": {
      const size = await resolveEffectiveSize(widgetInfo.widgetId, widgetInfo, {
        allowStore: true,
        skipIfInvalid: false,
      });
      if (!size) return;
      props.renderWidget(
        await buildWidget(size.width, size.height, undefined, (representation) =>
          props.renderWidget(representation),
        ),
      );
      break;
    }
    case "WIDGET_UPDATE": {
      // WIDGET_UPDATE can arrive while the device is in landscape with a
      // collapsed/min-height frame. Never overwrite the portrait home-screen
      // widget with that size; fall back to the last valid portrait size or
      // skip the update entirely.
      const size = await resolveEffectiveSize(widgetInfo.widgetId, widgetInfo, {
        allowStore: false,
        skipIfInvalid: true,
      });
      if (!size) return;
      props.renderWidget(
        await buildWidget(size.width, size.height, undefined, (representation) =>
          props.renderWidget(representation),
        ),
      );
      break;
    }
    default:
      break; // taps use OPEN_APP, handled natively
  }
}

/**
 * Call from inside the app after the quote changes so the widget updates
 * right away instead of waiting for the next scheduled refresh. Prepared
 * data avoids repeating the sheet read on the UI startup path.
 */
export async function refreshQuoteWidget(
  currentDayData?: WidgetQuoteData | null,
) {
  if (Platform.OS !== "android") return;
  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: async (widgetInfo) => {
        const size = await resolveEffectiveSize(widgetInfo.widgetId, widgetInfo, {
          allowStore: false,
          skipIfInvalid: false,
        });
        if (!size) {
          return buildWidget(
            DEFAULT_PORTRAIT_WIDTH,
            DEFAULT_PORTRAIT_HEIGHT,
            currentDayData,
          );
        }
        return buildWidget(size.width, size.height, currentDayData);
      },
      widgetNotFound: () => {
        // widget isn't on the home screen — nothing to do
      },
    });
  } catch (err) {
    console.log("[biblea] widget: refresh failed", err);
  }
}
