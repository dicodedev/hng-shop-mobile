import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/design/theme";
import { AppProviders } from "@/providers/app-providers";

/**
 * Routes.
 *
 * `payment/result` is the target of the Paystack return bridge. The bridge sends
 * navigation data only; this screen always reads authoritative payment status
 * from the authenticated API before showing any outcome.
 */
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
        <Stack.Screen name="checkout/index" />
        <Stack.Screen name="payment/processing" />
        <Stack.Screen name="payment/result" />
        <Stack.Screen name="order/[orderNumber]" />
      </Stack>
    </AppProviders>
  );
}
