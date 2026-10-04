import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space, type } from "@/design/theme";
import type { Product } from "@/features/catalogue/schema";
import { formatNgn } from "@/lib/money";

type ProductCardProps = { product: Product; index: number; compact: boolean };

export function ProductCard({ product, index, compact }: ProductCardProps) {
  const portrait = compact || index % 3 !== 1;

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
  card: { flex: 1, minWidth: 0, paddingBottom: space[8] },
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
