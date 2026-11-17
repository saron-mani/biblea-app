// index.js  (project root)
//
// Custom entry file so the widget task handler is registered when Android
// starts the app headlessly. Then set  "main": "index.js"  in package.json.

// --- If you use Expo Router (most new Expo templates do): ---
import "expo-router/entry";

// --- If you DON'T use Expo Router, replace the line above with: ---
// import { registerRootComponent } from "expo";
// import App from "./App";
// registerRootComponent(App);

import { registerWidgetTaskHandler } from "react-native-android-widget";

// The widget renderer (including SVG backgrounds and the quote repository)
// is only needed when Android actually runs a widget task. Keeping it behind
// a dynamic import avoids paying that cost on every normal app launch.
registerWidgetTaskHandler(async (props) => {
  const { widgetTaskHandler } = await import(
    "./src/widgets/widget-task-handler"
  );
  await widgetTaskHandler(props);
});
