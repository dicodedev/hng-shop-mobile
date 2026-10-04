import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space, type } from "@/design/theme";
import type { Cart } from "@/features/cart/schema";
import { cartSubtotalKobo } from "@/features/cart/schema";
import { formatNgn } from "@/lib/money";

/**
 * Order summary panel.
 *
 * Joined cart prices are display snapshots only. The server reprices
 * authoritatively when the order is created.
 */
export function OrderSummaryPanel({
  cart,
  total,
}: {
  cart: Cart;
  total?: number;
}) {
  const subtotal = total ?? cartSubtotalKobo(cart);

  return (
    <View accessibilityLabel="Order summary" style={styles.panel}>
      <Text style={styles.heading}>Your order</Text>

      {cart.items.map((item) => (
        <View key={item.id} style={styles.item}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={item.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            transition={150}
          />
          <View style={styles.itemBody}>
            <Text maxFontSizeMultiplier={1.6} style={styles.itemName}>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>
              {item.quantity} × {formatNgn(item.priceAmount)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.rule} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Subtotal</Text>
        <Text style={styles.rowValue}>{formatNgn(subtotal)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Delivery</Text>
        <Text style={styles.rowValue}>Complimentary</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatNgn(subtotal)}</Text>
      </View>

      <Text style={styles.disclaimer}>
        Prices are confirmed securely before payment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space[6],
  },
  heading: {
    ...type.eyebrow,
    color: colors.paper,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    gap: space[3],
    alignItems: "center",
    marginTop: space[5],
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.paperDeep,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: { ...type.body, color: colors.paper, fontFamily: fonts.sans },
  itemMeta: {
    ...type.bodySmall,
    color: colors.paper,
    opacity: 0.65,
    fontFamily: fonts.sans,
    marginTop: space[1],
  },
  rule: {
    borderTopColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.2,
    marginVertical: space[5],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: space[2],
  },
  rowLabel: {
    ...type.label,
    color: colors.paper,
    opacity: 0.65,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rowValue: { ...type.bodySmall, color: colors.paper, fontFamily: fonts.sans },
  totalLabel: {
    ...type.label,
    color: colors.paper,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  totalValue: { ...type.title, color: colors.paper, fontFamily: fonts.display },
  disclaimer: {
    ...type.bodySmall,
    color: colors.paper,
    opacity: 0.65,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
});
