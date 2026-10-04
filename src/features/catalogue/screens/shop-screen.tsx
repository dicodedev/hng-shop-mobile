import { useInfiniteQuery } from "@tanstack/react-query";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/brand-header";
import { CatalogueSkeleton } from "@/components/catalogue-skeleton";
import { EditorialState } from "@/components/editorial-state";
import { OfflineBanner } from "@/components/offline-banner";
import { PrimaryButton } from "@/components/primary-button";
import { colors, fonts, space, type } from "@/design/theme";
import { ProductCard } from "@/features/catalogue/components/product-card";
import { productsQuery } from "@/features/catalogue/queries";

export function ShopScreen() {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 390 || fontScale >= 1.3;
  const columns = compact ? 1 : 2;
  const products = useInfiniteQuery(productsQuery);
  const items = products.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.frame}>
        <BrandHeader />
        {products.isPending ? (
          <CatalogueSkeleton />
        ) : products.isError && items.length === 0 ? (
          <EditorialState
            actionLabel="Try again"
            body="We could not reach the collection. Check your connection and try once more."
            eyebrow="Collection unavailable"
            onAction={() => void products.refetch()}
            title="The pieces are out of view for a moment."
          />
        ) : (
          <FlatList
            key={columns}
            accessibilityLabel="HNG Shop product collection"
            columnWrapperStyle={columns === 2 ? styles.row : undefined}
            contentContainerStyle={styles.content}
            data={items}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <EditorialState
                body="The next selection is being prepared. Please check back soon."
                eyebrow="A quiet shelf"
                title="The collection is temporarily unavailable."
              />
            }
            ListFooterComponent={
              products.hasNextPage ? (
                <View style={styles.footer}>
                  <PrimaryButton
                    disabled={products.isFetchingNextPage}
                    label={
                      products.isFetchingNextPage ? "Loading" : "Load more"
                    }
                    onPress={() => void products.fetchNextPage()}
                    style={styles.footerButton}
                  />
                </View>
              ) : null
            }
            ListHeaderComponent={
              <View style={styles.intro}>
                <Text style={styles.eyebrow}>The collection</Text>
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.5}
                  style={styles.heading}
                >
                  Objects for{"\n"}living well.
                </Text>
                <Text style={styles.supporting}>
                  Expressive pieces and dependable essentials, selected for
                  modern Nigerian life.
                </Text>
                <View style={styles.collectionRule}>
                  <Text style={styles.collectionMeta}>
                    Collection 001 / Lagos
                  </Text>
                  <Text style={styles.collectionMeta}>
                    {items.length} {items.length === 1 ? "piece" : "pieces"} /
                    Free delivery
                  </Text>
                </View>
                {products.isError ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.staleNotice}
                  >
                    Showing the saved collection. Pull to refresh when you are
                    back online.
                  </Text>
                ) : null}
              </View>
            }
            numColumns={columns}
            onRefresh={() => void products.refetch()}
            refreshing={products.isRefetching && !products.isFetchingNextPage}
            renderItem={({ item, index }) => (
              <View style={columns === 2 ? styles.cell : styles.fullCell}>
                <ProductCard compact={compact} index={index} product={item} />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5] },
  content: { paddingBottom: space[12] },
  intro: { paddingTop: space[10], paddingBottom: space[10] },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heading: {
    ...type.displayHero,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[4],
  },
  supporting: {
    ...type.bodyLarge,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[5],
    maxWidth: 500,
  },
  collectionRule: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space[3],
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[8],
    paddingTop: space[4],
  },
  collectionMeta: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  staleNotice: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  footer: { paddingVertical: space[8] },
  footerButton: { alignSelf: "flex-start" },
  row: { gap: space[4] },
  cell: { flex: 1, minWidth: 0 },
  fullCell: { width: "100%" },
});
