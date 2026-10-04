import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { EditorialState } from "@/components/editorial-state";
import { PrimaryButton } from "@/components/primary-button";
import { colors, control, fonts, radius, space, type } from "@/design/theme";
import { useCartMutations } from "@/features/cart/queries";
import { MAX_ITEM_QUANTITY } from "@/features/cart/schema";
import { productQuery } from "@/features/catalogue/queries";
import { CatalogueNotFoundError } from "@/features/catalogue/repositories/catalogue-repository";
import { formatNgn } from "@/lib/money";

export function ProductScreen({ slug }: { slug: string }) {
  const { status, configured } = useAuth();
  const product = useQuery(productQuery(slug));
  const { addItem, enabled } = useCartMutations();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const authenticated = status === "authenticated";

  const handleAdd = async () => {
    const item = product.data;
    if (!item) return;

    if (!authenticated) {
      router.push({
        pathname: "/auth/sign-in",
        params: { intent: "product", slug: item.slug },
      });
      return;
    }

    setActionError(null);
    try {
      const cart = await addItem.mutateAsync({ productId: item.id });
      const line = cart.items.find((entry) => entry.id === item.id);
      const nextQuantity = line?.quantity ?? 1;
      setAnnouncement(`${item.name} added. Cart now has ${nextQuantity}.`);
    } catch {
      setActionError("We could not update your cart. Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to collection"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons color={colors.ink} name="arrow-back" size={22} />
          <Text style={styles.backLabel}>Collection</Text>
        </Pressable>
        <Text style={styles.wordmark}>HNG Shop</Text>
      </View>

      {product.isPending ? (
        <View
          accessibilityLabel="Loading product details"
          accessibilityRole="progressbar"
          style={styles.loading}
        >
          <View style={styles.loadingImage} />
          <View style={styles.loadingTitle} />
        </View>
      ) : product.error instanceof CatalogueNotFoundError ? (
        <View style={styles.stateFrame}>
          <EditorialState
            actionLabel="Return to shop"
            body="This piece may have left the current collection."
            eyebrow="Not in the collection"
            onAction={() => router.replace("/")}
            title="We could not find that piece."
          />
        </View>
      ) : product.isError || !product.data ? (
        <View style={styles.stateFrame}>
          <EditorialState
            actionLabel="Try again"
            body="We could not load this piece. Check your connection and try once more."
            eyebrow="Temporarily unavailable"
            onAction={() => void product.refetch()}
            title="The details are out of view."
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image
            accessibilityLabel={product.data.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: product.data.imageUrl }}
            style={styles.hero}
            transition={250}
          />
          <Text style={styles.eyebrow}>HNG / Collection 001</Text>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.5}
            style={styles.title}
          >
            {product.data.name}
          </Text>
          <Text maxFontSizeMultiplier={1.8} style={styles.price}>
            {formatNgn(product.data.price.amountKobo)}
          </Text>
          <Text style={styles.description}>{product.data.description}</Text>

          <PrimaryButton
            disabled={authenticated && (!enabled || addItem.isPending)}
            label={
              addItem.isPending
                ? "Adding"
                : authenticated
                  ? "Add to cart"
                  : "Sign in to add"
            }
            onPress={() => void handleAdd()}
            style={styles.button}
          />

          {announcement ? (
            <Text accessibilityLiveRegion="polite" style={styles.announcement}>
              {announcement}
            </Text>
          ) : null}
          {actionError ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
          {!authenticated ? (
            <Text style={styles.cartNote}>
              {configured
                ? "Sign in with Google to add this piece to your account cart."
                : "Your account cart becomes available once sign-in is configured."}
            </Text>
          ) : !enabled ? (
            <Text style={styles.cartNote}>
              Cart changes need a connection. Reconnect to continue.
            </Text>
          ) : (
            <Text style={styles.cartNote}>
              Up to {MAX_ITEM_QUANTITY} of each piece. Prices are confirmed
              securely before payment.
            </Text>
          )}

          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Delivery</Text>
              <Text style={styles.factValue}>Complimentary across Nigeria</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Currency</Text>
              <Text style={styles.factValue}>Priced in Nigerian naira</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  topBar: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[5],
  },
  back: {
    minHeight: control.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  backLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  wordmark: { ...type.title, color: colors.ink, fontFamily: fonts.display },
  content: {
    paddingHorizontal: space[5],
    paddingTop: space[5],
    paddingBottom: space[16],
  },
  hero: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    backgroundColor: colors.paperDeep,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: space[8],
  },
  title: {
    ...type.displayScreen,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[3],
  },
  price: {
    ...type.bodyLarge,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    marginTop: space[4],
  },
  description: {
    ...type.bodyLarge,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[6],
  },
  button: { marginTop: space[8] },
  announcement: {
    ...type.bodySmall,
    color: colors.moss,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
  error: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
  cartNote: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
  facts: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[10],
  },
  fact: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[5],
  },
  factLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  factValue: {
    ...type.body,
    color: colors.ink,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
  loading: { flex: 1, padding: space[5] },
  loadingImage: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    backgroundColor: colors.paperDeep,
  },
  loadingTitle: {
    width: "70%",
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.paperDeep,
    marginTop: space[8],
  },
  stateFrame: { flex: 1, paddingHorizontal: space[5] },
});
