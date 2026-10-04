import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, control, fonts, space, type } from "@/design/theme";
import { useCartItemCount } from "@/features/cart/queries";

type BackTarget = {
  /**
   * Short visible label. The header has limited horizontal room, so this stays
   * a single word and the destination is carried by `accessibilityLabel`.
   */
  label: string;
  /**
   * Screen-reader label naming the destination, for example "Back to orders".
   * Defaults to `label` when omitted.
   */
  accessibilityLabel?: string;
  href: Href;
  /**
   * Overrides the default smart-back behaviour. Used by checkout, where
   * leaving discards a delivery draft and must be confirmed.
   */
  onPress?: () => void;
};

type ScreenHeaderProps = {
  /**
   * Explicit destination for the back control. Smart back pops the stack when
   * history exists and otherwise navigates to this route, so a cold deep link
   * never exits the app.
   */
  back?: BackTarget;
  /**
   * Cart control. Shown on product and order detail only, so a customer is not
   * diverted mid-checkout.
   */
  showCart?: boolean;
};

/**
 * Shared chrome for stack screens.
 *
 * The tab bar is hidden above the tab routes, so every stack screen needs its
 * own way back to a known destination. The wordmark is plain text rather than a
 * heading so each screen keeps exactly one logical heading.
 */
export function ScreenHeader({ back, showCart = false }: ScreenHeaderProps) {
  const cartCount = useCartItemCount();
  const itemCount = showCart ? cartCount : 0;

  const handleBack = () => {
    if (!back) return;
    if (back.onPress) {
      back.onPress();
      return;
    }
    if (router.canGoBack()) router.dismissTo(back.href);
    else router.replace(back.href);
  };

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {back ? (
          <Pressable
            accessibilityLabel={back.accessibilityLabel ?? back.label}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
            ]}
          >
            <Text maxFontSizeMultiplier={1.5} style={styles.actionLabel}>
              {back.label}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text maxFontSizeMultiplier={1.4} style={styles.wordmark}>
        HNG Shop
      </Text>

      <View style={[styles.side, styles.sideEnd]}>
        {showCart ? (
          <Pressable
            accessibilityLabel={
              itemCount > 0 ? `Cart, ${itemCount} items` : "Cart, empty"
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/cart")}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
            ]}
          >
            <Text maxFontSizeMultiplier={1.5} style={styles.actionLabel}>
              Cart
            </Text>
            {/* The count is text, never colour alone. */}
            {itemCount > 0 ? (
              <Text accessibilityLabel={`${itemCount}`} style={styles.count}>
                {itemCount}
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[5],
  },
  side: { flexDirection: "row", alignItems: "center", minWidth: 72 },
  sideEnd: { justifyContent: "flex-end" },
  action: {
    minHeight: control.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  actionPressed: { opacity: 0.6 },
  actionLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  count: {
    ...type.badge,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  wordmark: {
    ...type.title,
    color: colors.ink,
    fontFamily: fonts.display,
    textAlign: "center",
  },
});
