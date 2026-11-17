import { Platform } from "react-native";
import type { WidgetQuoteData } from "./widget-task-handler";

/** Refreshes the widget without pulling its renderer into the startup bundle. */
export async function refreshQuoteWidget(
  currentDayData?: WidgetQuoteData | null,
): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    const { refreshQuoteWidget: refresh } = await import(
      "./widget-task-handler"
    );
    await refresh(currentDayData);
  } catch (err) {
    console.log("[biblea] widget: refresh failed", err);
  }
}
