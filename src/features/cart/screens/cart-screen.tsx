import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/brand-header";
import { EditorialState } from "@/components/editorial-state";
import { OfflineBanner } from "@/components/offline-banner";
import { PrimaryButton } from "@/components/primary-button";
import { colors, control, fonts, radius, space, type } from "@/design/theme";
import { useCartMutations, useCartQuery } from "@/features/cart/queries";
import {
  cartSubtotalKobo,
  hasUnavailableItems,
  type CartItem,
} from "@/features/cart/schema";
import { useAuth } from "@/auth/session-provider";
import { formatNgn } from "@/lib/money";

export function CartScreen() {
  const { status } = useAuth();
  const cart = useCartQuery();
  const { enabled, setQuantity, removeItem } = useCartMutations();

  if (status !== "authenticated") {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <BrandHeader />
          <EditorialState
            actionLabel="Sign in"
            body="Your cart follows your HNG Shop account and is shared with the web store."
            eyebrow="Sign in to continue"
            onAction={() =>
              router.push({
                pathname: "/auth/sign-in",
                params: { intent: "cart" },
              })
            }
            title="Your cart, wherever you shop."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (cart.isPending) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <BrandHeader />
          <View
            accessibilityLabel="Loading your cart"
            accessibilityRole="progressbar"
            style={styles.skeleton}
          >
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (cart.isError && !cart.data) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <BrandHeader />
          <EditorialState
            actionLabel="Try again"
            body="We could not load your cart. Check your connection and try once more."
            eyebrow="Cart unavailable"
            onAction={() => void cart.refetch()}
            title="Your cart is out of view for a moment."
          />
        </View>
      </SafeAreaView>
    );
  }

  const items = cart.data?.items ?? [];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.frame}>
        <BrandHeader />
        {items.length === 0 ? (
          <EditorialState
            actionLabel="Browse the collection"
            body="Once you add a piece it will appear here and stay with your account."
            eyebrow="Empty cart"
            onAction={() => router.push("/")}
            title="Nothing selected yet."
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {cart.isError ? (
              <Text accessibilityLiveRegion="polite" style={styles.staleNotice}>
                Showing your last loaded cart. Reconnect to refresh it.
              </Text>
            ) : null}

            <View style={styles.rule} />

            {items.map((item) => (
              <CartRow
                enabled={enabled}
                item={item}
                key={item.id}
                onDecrement={() =>
                  setQuantity.mutate({
                    productId: item.id,
                    quantity: item.quantity - 1,
                  })
                }
                onIncrement={() =>
                  setQuantity.mutate({
                    productId: item.id,
                    quantity: item.quantity + 1,
                  })
                }
                onRemove={() => removeItem.mutate({ productId: item.id })}
              />
            ))}

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatNgn(cartSubtotalKobo(cart.data))}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Complimentary</Text>
              </View>
              <Text style={styles.disclaimer}>
                Prices are confirmed securely before payment.
              </Text>
            </View>

            {hasUnavailableItems(cart.data) ? (
              <Text accessibilityLiveRegion="polite" style={styles.warning}>
                A piece in your cart is no longer available. Remove it before
                checking out.
              </Text>
            ) : null}

            <PrimaryButton
              disabled
              label="Checkout coming next"
              style={styles.checkout}
            />
            <Text style={styles.checkoutNote}>
              Checkout and payment connect once our order service is deployed.
            </Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function CartRow({
  item,
  enabled,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  enabled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={item.name}
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: item.imageUrl }}
        style={styles.thumbnail}
        transition={150}
      />
      <View style={styles.rowBody}>
        <Text maxFontSizeMultiplier={1.6} style={styles.rowName}>
          {item.name}
        </Text>
        <Text style={styles.rowPrice}>{formatNgn(item.priceAmount)} each</Text>
        {!item.available ? (
          <Text style={styles.warning}>Unavailable</Text>
        ) : null}
        <View style={styles.rowControls}>
          <Pressable
            accessibilityLabel={
              item.quantity === 1
                ? `Remove ${item.name} from cart`
                : `Decrease ${item.name} quantity`
            }
            accessibilityRole="button"
            disabled={!enabled}
            hitSlop={8}
            onPress={item.quantity === 1 ? onRemove : onDecrement}
            style={({ pressed }) => [
              styles.stepper,
              pressed && enabled && styles.stepperPressed,
              !enabled && styles.disabled,
            ]}
          >
            <Ionicons color={colors.ink} name="remove" size={18} />
          </Pressable>
          <Text
            accessibilityLabel={`${item.name} quantity ${item.quantity}`}
            style={styles.quantity}
          >
            {item.quantity}
          </Text>
          <Pressable
            accessibilityLabel={`Increase ${item.name} quantity`}
            accessibilityRole="button"
            disabled={!enabled || item.quantity >= 99}
            hitSlop={8}
            onPress={onIncrement}
            style={({ pressed }) => [
              styles.stepper,
              pressed && enabled && styles.stepperPressed,
              !enabled && styles.disabled,
            ]}
          >
            <Ionicons color={colors.ink} name="add" size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Remove ${item.name} from cart`}
            accessibilityRole="button"
            disabled={!enabled}
            hitSlop={8}
            onPress={onRemove}
            style={({ pressed }) => [
              styles.remove,
              pressed && enabled && styles.removePressed,
              !enabled && styles.disabled,
            ]}
          >
            <Text style={styles.removeLabel}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5] },
  content: { paddingBottom: space[16] },
  rule: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[2],
  },
  row: {
    flexDirection: "row",
    gap: space[4],
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[5],
  },
  thumbnail: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.paperDeep,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { ...type.title, color: colors.ink, fontFamily: fonts.display },
  rowPrice: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[1],
  },
  rowControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    marginTop: space[4],
  },
  stepper: {
    minWidth: control.minimumTouchTarget,
    minHeight: control.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
  },
  stepperPressed: { borderColor: colors.accent },
  quantity: {
    ...type.body,
    color: colors.ink,
    fontFamily: fonts.sans,
    minWidth: 28,
    textAlign: "center",
  },
  remove: {
    minHeight: control.minimumTouchTarget,
    justifyContent: "center",
    marginLeft: space[2],
  },
  removePressed: { opacity: 0.6 },
  removeLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summary: {
    marginTop: space[8],
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[5],
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: space[3],
  },
  summaryLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    ...type.bodyLarge,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
  },
  disclaimer: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
  },
  warning: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  staleNotice: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  checkout: { marginTop: space[8] },
  checkoutNote: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
  disabled: { opacity: 0.4 },
  skeleton: { paddingTop: space[10], gap: space[5] },
  skeletonRow: {
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.paperDeep,
  },
});
