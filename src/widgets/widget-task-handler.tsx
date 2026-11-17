// src/widgets/widget-task-handler.tsx
//
// Android calls this (in a headless JS context, app closed) whenever the
// widget is added, resized, or its updatePeriodMillis timer fires.
// It shares the same Google Sheets cache + daily rollover as the app, looks
// the verse up through the bundled SQLite repository, and generates the
// background from the date (see backgrounds.ts) without downloading images.

import { Platform } from "react-native";
import {
  requestWidgetUpdate,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget";

// NOTE: this file lives in src/widgets, so ".." is src/.
import { getCurrentDayData, todayKey } from "../components/bibleQuoteService";
import { getVerse } from "../components/quoteRepository";
import { malayalamBooks } from "../malayalamBooks";
import { QuoteWidget } from "./QuoteWidget";

/** Must match widgets[].name in the app.json plugin config. */
export const WIDGET_NAME = "DailyQuote";

export interface WidgetQuoteData {
  book: string;
  chapter: string;
  verse: string;
}

async function loadWidgetData(): Promise<{
  quote: string;
  address: string;
} | null> {
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
  width = 300,
  height = 300,
  prepared?: WidgetQuoteData | null,
) {
  let data: Awaited<ReturnType<typeof loadWidgetData>> = null;

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

  const shared = {
    quote: data?.quote,
    address: data?.address,
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

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  if (widgetInfo.widgetName !== WIDGET_NAME) return;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      props.renderWidget(
        await buildWidget(widgetInfo.width, widgetInfo.height),
      );
      break;
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
      renderWidget: (widgetInfo) =>
        buildWidget(widgetInfo.width, widgetInfo.height, currentDayData),
      widgetNotFound: () => {
        // widget isn't on the home screen — nothing to do
      },
    });
  } catch (err) {
    console.log("[biblea] widget: refresh failed", err);
  }
}
