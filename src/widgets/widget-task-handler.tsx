// src/widgets/widget-task-handler.tsx
//
// Android calls this (in a headless JS context, app closed) whenever the
// widget is added, resized, or its updatePeriodMillis timer fires.
// It reuses getCurrentDayData(), so the widget shares the same Google Sheets
// cache + daily rollover as the app, and looks the verse text up in
// quoteBank.json the same way src/app/index.tsx does.
//
// The background is generated from the date (see backgrounds.ts), so no
// images are downloaded or converted for the widget any more.

import { Platform } from "react-native";
import {
  requestWidgetUpdate,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget";

// NOTE: this file lives in src/widgets, so ".." is src/.
import { getCurrentDayData, todayKey } from "../components/bibleQuoteService";
import { malayalamBooks } from "../malayalamBooks";
import QuoteBank from "../quoteBank.json";
import { QuoteWidget } from "./QuoteWidget";

/** Must match widgets[].name in the app.json plugin config. */
export const WIDGET_NAME = "DailyQuote";

async function loadWidgetData() {
  const { currentDayData } = await getCurrentDayData();
  if (!currentDayData) return null; // sheet has no row for today

  const { book, chapter, verse } = currentDayData;

  // Same lookup as resolveDailyQuote() in src/app/index.tsx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quote: string | undefined = (QuoteBank as any)[book]?.[chapter]?.[
    verse
  ];
  if (!quote) return null;

  const bookName = malayalamBooks[book] || book;
  const address = `${bookName} ${parseInt(chapter, 10)}:${parseInt(verse, 10)}`;

  return { quote, address };
}

async function buildWidget(width = 300, height = 300) {
  let data: Awaited<ReturnType<typeof loadWidgetData>> = null;
  try {
    data = await loadWidgetData();
  } catch (err) {
    console.log("[biblea] widget: loading today's data failed", err);
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
 * Call from inside the app (e.g. after the quote hook loads) so the widget
 * updates right away instead of waiting for the next scheduled refresh.
 */
export async function refreshQuoteWidget() {
  if (Platform.OS !== "android") return;
  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: (widgetInfo) =>
        buildWidget(widgetInfo.width, widgetInfo.height),
      widgetNotFound: () => {
        // widget isn't on the home screen — nothing to do
      },
    });
  } catch (err) {
    console.log("[biblea] widget: refresh failed", err);
  }
}
