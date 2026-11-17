import AnekMalayalam_400Regular from "@expo-google-fonts/anek-malayalam/400Regular/AnekMalayalam_400Regular.ttf";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

// Keep the native splash up until the first feed item is renderable.
// The app hides it in src/app/index.tsx.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Only the regular face is used by the UI. The font swaps in when ready;
  // it no longer blocks the whole app from mounting.
  useFonts({ AnekMalayalam_400Regular });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}
