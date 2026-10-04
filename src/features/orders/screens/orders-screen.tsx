import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { BrandHeader } from "@/components/brand-header";
import { EditorialState } from "@/components/editorial-state";
import { PrimaryButton } from "@/components/primary-button";
import { FulfillmentPill, StatusPill } from "@/components/status-pill";
import { colors, fonts, space, type } from "@/design/theme";
import { useOrdersQuery } from "@/features/orders/queries";
import type { OrderSummary } from "@/features/orders/schema";
import { formatNgn } from "@/lib/money";

export function formatOrderDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function spokenPaymentState(order: OrderSummary): string {
  return order.paymentStatus === "awaiting_payment"
    ? "awaiting payment"
    : order.paymentStatus.replace(/_/g, " ");
}

export function OrdersScreen() {
  const { status } = useAuth();
  const orders = useOrdersQuery();

  if (status !== "authenticated") {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.frame}>
          <BrandHeader />
          <EditorialState
            actionLabel="Sign in"
            body="Your orders follow your HNG Shop account across mobile and web."
            eyebrow="Sign in to continue"
            onAction={() =>
              router.push({
                pathname: "/auth/sign-in",
                params: { intent: "orders" },
              })
            }
            title="Your order history."
          />
        </View>
      </SafeAreaView>
    );
  }

  const items = orders.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.frame}>
        <BrandHeader />
        {orders.isPending ? (
          <View
            accessibilityLabel="Loading your orders"
            accessibilityRole="progressbar"
            style={styles.skeleton}
          />
        ) : orders.isError && items.length === 0 ? (
          <EditorialState
            actionLabel="Try again"
            body="We could not load your orders. Check your connection and try once more."
            eyebrow="Orders unavailable"
            onAction={() => void orders.refetch()}
            title="Your orders are out of view."
          />
        ) : (
          <FlatList
            accessibilityLabel="Your orders"
            contentContainerStyle={styles.content}
            data={items}
            keyExtractor={(item) => item.orderNumber}
            ListEmptyComponent={
              <EditorialState
                body="When you buy a piece it will appear here with its payment and fulfilment status."
                eyebrow="No orders yet"
                title="Your first order starts here."
              />
            }
            ListFooterComponent={
              orders.hasNextPage ? (
                <PrimaryButton
                  disabled={orders.isFetchingNextPage}
                  label={orders.isFetchingNextPage ? "Loading" : "Load more"}
                  onPress={() => void orders.fetchNextPage()}
                  style={styles.footer}
                />
              ) : null
            }
            onRefresh={() => void orders.refetch()}
            refreshing={orders.isRefetching}
            renderItem={({ item }) => <OrderRow order={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Pressable
      accessibilityHint="Opens order details"
      accessibilityLabel={`Order ${order.orderNumber}, ${spokenPaymentState(order)}, ${formatNgn(order.total.amountKobo)}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/order/[orderNumber]",
          params: { orderNumber: order.orderNumber },
        })
      }
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.total}>{formatNgn(order.total.amountKobo)}</Text>
      </View>
      <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
      <View style={styles.pills}>
        <StatusPill paymentState={order.paymentStatus} />
        <View style={styles.pillGap} />
        <FulfillmentPill state={order.fulfillmentStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5] },
  content: { paddingBottom: space[12] },
  row: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[5],
  },
  rowPressed: { opacity: 0.6 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  orderNumber: { ...type.title, color: colors.ink, fontFamily: fonts.display },
  total: {
    ...type.body,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
  },
  date: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[1],
  },
  pills: { flexDirection: "row", marginTop: space[3] },
  pillGap: { width: space[2] },
  skeleton: {
    height: 140,
    marginTop: space[8],
    borderRadius: 12,
    backgroundColor: colors.paperDeep,
  },
  footer: { marginTop: space[8] },
});
