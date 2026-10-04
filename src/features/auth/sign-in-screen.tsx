import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/primary-button";
import { EditorialState } from "@/components/editorial-state";
import { ScreenHeader } from "@/components/screen-header";
import { colors, control, fonts, space, type } from "@/design/theme";
import { useAuth } from "@/auth/session-provider";
import { resolveIntentPath } from "@/auth/redirect-state";

type SignInOutcome = "signed-in" | "cancelled" | "failed" | null;

export function SignInScreen() {
  const { status, configured, signInWithGoogle } = useAuth();
  const params = useLocalSearchParams<{ intent?: string; slug?: string }>();
  const [outcome, setOutcome] = useState<SignInOutcome>(null);
  const [busy, setBusy] = useState(false);

  const destination =
    resolveIntentPath(params.intent, { slug: params.slug }) ?? "/";

  // Sign-in can be cold-started from a link, so fall back to the intended
  // destination instead of exiting the app when there is no history.
  const leaveSignIn = () => {
    if (router.canGoBack()) router.back();
    else router.replace(destination);
  };

  const handleSignIn = async () => {
    setBusy(true);
    setOutcome(null);
    try {
      const result = await signInWithGoogle();
      setOutcome(result);
      if (result === "signed-in") router.replace(destination);
    } finally {
      setBusy(false);
    }
  };

  if (status === "authenticated") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Continue"
            body="You are already signed in on this device."
            eyebrow="Signed in"
            onAction={() => router.replace(destination)}
            title="Welcome back to HNG Shop."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScreenHeader back={{ label: "Back", href: "/", onPress: leaveSignIn }} />

      <View style={styles.frame}>
        <Text style={styles.eyebrow}>HNG Shop</Text>
        <Text accessibilityRole="header" style={styles.headline}>
          A considered way to shop.
        </Text>
        <Text style={styles.supporting}>
          Sign in with Google to keep your cart, orders, and delivery details in
          one place across mobile and web.
        </Text>

        {configured ? (
          <>
            <PrimaryButton
              disabled={busy || status === "loading"}
              label={busy ? "Opening Google" : "Continue with Google"}
              onPress={() => void handleSignIn()}
              style={styles.button}
            />
            {outcome === "cancelled" ? (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                Sign-in was cancelled. Your cart is unchanged.
              </Text>
            ) : null}
            {outcome === "failed" ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                We could not complete sign-in. Please try again.
              </Text>
            ) : null}
          </>
        ) : (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            Sign-in is not configured for this build yet.
          </Text>
        )}

        <View style={styles.trust}>
          <Text style={styles.trustLabel}>Privacy</Text>
          <Text style={styles.trustBody}>
            HNG Shop never sees your Google password. Your session is stored in
            this device&apos;s secure storage and used only to talk to our shop.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5], paddingTop: space[4] },
  back: {
    minHeight: control.minimumTouchTarget,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: space[6],
  },
  headline: {
    ...type.displayScreen,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[4],
  },
  supporting: {
    ...type.bodyLarge,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[6],
    maxWidth: 520,
  },
  button: { marginTop: space[10] },
  notice: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  error: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  trust: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[10],
    paddingTop: space[5],
  },
  trustLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trustBody: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[2],
    maxWidth: 520,
  },
});
