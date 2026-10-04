import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/brand-header";
import { EditorialState } from "@/components/editorial-state";
import { PrimaryButton } from "@/components/primary-button";
import { colors, control, fonts, space, type } from "@/design/theme";
import { useProfileQuery } from "@/features/account/queries";
import { useAuth } from "@/auth/session-provider";

export function AccountScreen() {
  const { status, configured, signOut } = useAuth();
  const profile = useProfileQuery();
  const [signingOut, setSigningOut] = useState(false);

  if (status !== "authenticated") {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <BrandHeader />
          <EditorialState
            actionLabel={configured ? "Sign in" : undefined}
            body={
              configured
                ? "Sign in with Google to see your details and order history."
                : "Account features are not configured for this build yet."
            }
            eyebrow="Your account"
            onAction={
              configured
                ? () =>
                    router.push({
                      pathname: "/auth/sign-in",
                      params: { intent: "account" },
                    })
                : undefined
            }
            title="Sign in to HNG Shop."
          />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.data?.fullName?.trim() || "HNG Shop customer";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.frame}>
        <BrandHeader />
        <View style={styles.identity}>
          {profile.data?.avatarUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel=""
              contentFit="cover"
              source={{ uri: profile.data.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.5}
            style={styles.name}
          >
            {name}
          </Text>
          {profile.data?.email ? (
            <Text maxFontSizeMultiplier={1.5} style={styles.email}>
              {profile.data.email}
            </Text>
          ) : profile.isError ? (
            <Text accessibilityLiveRegion="polite" style={styles.muted}>
              We could not refresh your details. Pull the Orders tab to retry.
            </Text>
          ) : null}
        </View>

        <View style={styles.links}>
          <AccountLink
            label="Your orders"
            onPress={() => router.push("/orders")}
          />
          <AccountLink
            label="Back to the collection"
            onPress={() => router.push("/")}
          />
        </View>

        <PrimaryButton
          disabled={signingOut}
          label={signingOut ? "Signing out" : "Sign out"}
          onPress={() => {
            setSigningOut(true);
            void signOut().finally(() => setSigningOut(false));
          }}
          style={styles.signOut}
        />
        <Text style={styles.note}>
          Signing out keeps your cart in your account.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function AccountLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
    >
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5] },
  identity: { paddingTop: space[10] },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.paperDeep,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    ...type.displaySection,
    color: colors.paper,
    fontFamily: fonts.display,
  },
  name: {
    ...type.displaySection,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[5],
  },
  email: {
    ...type.body,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
  muted: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
  links: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[10],
  },
  link: {
    minHeight: control.standardHeight,
    justifyContent: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkPressed: { opacity: 0.6 },
  linkLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  signOut: { marginTop: space[10] },
  note: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
});
