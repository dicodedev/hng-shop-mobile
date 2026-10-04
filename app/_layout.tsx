import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/design/theme";
import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.paper },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[slug]" />
        <Stack.Screen name="auth/sign-in" />
      </Stack>
    </AppProviders>
  );
}
