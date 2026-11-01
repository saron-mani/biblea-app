// src/widgets/widget-task-handler.tsx
//
// Android calls this (in a headless JS context, app closed) whenever the
// widget is added, resized, or its updatePeriodMillis timer fires.
// It reuses getCurrentDayData(), so the widget shares the exact same
// 5-day Google Sheets cache + daily rollover as the app, and looks the verse
// text up in quoteBank.json the same way src/app/index.tsx does.

import * as FileSystem from "expo-file-system/legacy";
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

/** Images bigger than this are skipped (they'd bloat the widget bitmap). */
const MAX_INLINE_BYTES = 4 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const TMP_DIR = `${FileSystem.cacheDirectory}biblea-widget/`;

function extOf(uri: string) {
  return uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
}

/**
 * The widget can only use https URLs or data:image URIs (not file://), and
 * the SVG backdrop can only use data URIs. So: use the already-cached local
 * file if there is one, otherwise download the remote URL once, then return
 * the file as a base64 data URI.
 */
async function toDataUri(
  cachedUri?: string | null,
  remoteUrl?: string | null,
): Promise<string | null> {
  try {
    let localUri: string | null =
      cachedUri && !/^https?:/i.test(cachedUri) ? cachedUri : null;

    if (!localUri) {
      const remote =
        remoteUrl ??
        (cachedUri && /^https?:/i.test(cachedUri) ? cachedUri : null);
      if (!remote) return null;
      const dir = await FileSystem.getInfoAsync(TMP_DIR);
      if (!dir.exists) {
        await FileSystem.makeDirectoryAsync(TMP_DIR, { intermediates: true });
      }
      const target = `${TMP_DIR}${Math.abs(hash(remote))}.${extOf(remote)}`;
      const res = await FileSystem.downloadAsync(remote, target);
      localUri = res.uri;
    }

    const info = await FileSystem.getInfoAsync(localUri);
    if (!info.exists || info.size > MAX_INLINE_BYTES) return null;

    const mime = MIME_BY_EXT[extOf(localUri)] ?? "image/jpeg";
    const b64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mime};base64,${b64}`;
  } catch (err) {
    console.log("[biblea] widget: image load failed", err);
    return null;
  }
}

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

async function loadWidgetData() {
  const { currentDayData, window } = await getCurrentDayData();
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

  const row = window?.[todayKey()];
  const [imageA, imageB] = await Promise.all([
    toDataUri(currentDayData.imageA, row?.imageA),
    toDataUri(currentDayData.imageB, row?.imageB),
  ]);

  return { quote, address, imageA, imageB };
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
    imageA: data?.imageA,
    imageB: data?.imageB,
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
