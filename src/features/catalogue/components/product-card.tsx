import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space, type } from "@/design/theme";
import type { Product } from "@/features/catalogue/schema";
import { formatNgn } from "@/lib/money";

type ProductCardProps = {
  product: Product;
  /**
   * Rhythm variant. Landscape crops appear every third product, matching the
   * editorial intent in `DESIGN_SYSTEM.md`.
   */
  index: number;
  compact: boolean;
  /**
   * True when the catalogue renders a single column. Rhythm crops are skipped
   * in a multi-column grid because a short landscape card would leave a void
   * beside a taller portrait neighbour.
   */
  singleColumn: boolean;
};

export function ProductCard({
  product,
  index,
  compact,
  singleColumn,
}: ProductCardProps) {
  // Narrow layouts and large text keep the portrait crop. A multi-column grid
  // also stays uniform, because a short landscape card beside a tall portrait
  // neighbour leaves a void. Rhythm crops apply only in the roomier
  // single-column layout.
  const portrait = compact || !singleColumn || index % 3 !== 1;

  return (
    <Link
      href={{ pathname: "/product/[slug]", params: { slug: product.slug } }}
      asChild
    >
      <Pressable
        accessibilityHint="Opens product details"
        accessibilityLabel={`${product.name}, ${formatNgn(product.price.amountKobo)}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={product.name}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: product.imageUrl }}
          style={[styles.image, portrait ? styles.portrait : styles.landscape]}
          transition={200}
        />
        <View style={styles.meta}>
          <Text maxFontSizeMultiplier={1.8} style={styles.name}>
            {product.name}
          </Text>
          <Text maxFontSizeMultiplier={1.8} style={styles.price}>
            {formatNgn(product.price.amountKobo)}
          </Text>
        </View>
        <Text
          maxFontSizeMultiplier={1.6}
          numberOfLines={compact ? undefined : 2}
          style={styles.description}
        >
          {product.description}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  // No trailing padding here: row spacing belongs to the list so the final
  // row does not leave a dead band above the list's own bottom padding.
  card: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.72 },
  image: {
    width: "100%",
    backgroundColor: colors.paperDeep,
    borderRadius: radius.xl,
  },
  portrait: { aspectRatio: 4 / 5 },
  landscape: { aspectRatio: 5 / 4 },
  meta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space[3],
    marginTop: space[4],
  },
  name: {
    ...type.title,
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.display,
  },
  price: {
    ...type.bodySmall,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
  },
  description: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
});
