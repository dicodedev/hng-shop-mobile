import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { EditorialState } from "@/components/editorial-state";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { FulfillmentPill, StatusPill } from "@/components/status-pill";
import { colors, fonts, radius, space, type } from "@/design/theme";
import { useOrderQuery } from "@/features/orders/queries";
import { OrderNotFoundError } from "@/features/orders/schema";
import { emailStateLabel } from "@/features/payments/payment-state";
import { formatNgn } from "@/lib/money";
import { formatOrderDate } from "@/features/orders/screens/orders-screen";

/**
 * Order detail.
 *
 * Missing and non-owned orders share this same not-found state so ownership
 * cannot be probed. Item names, images, prices, and totals come from immutable
 * order snapshots.
 */
export function OrderDetailScreen({ orderNumber }: { orderNumber: string }) {
  const { status } = useAuth();
  const order = useOrderQuery(orderNumber);

  if (status !== "authenticated") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader
          back={{
            label: "Back",
            accessibilityLabel: "Back to orders",
            href: "/orders",
          }}
          showCart
        />
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Sign in"
            body="Sign in to view this order."
            eyebrow="Sign in to continue"
            onAction={() =>
              router.replace({
                pathname: "/auth/sign-in",
                params: { intent: "orders" },
              })
            }
            title="This order is private."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (order.isPending) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader
          back={{
            label: "Back",
            accessibilityLabel: "Back to orders",
            href: "/orders",
          }}
          showCart
        />
        <View style={styles.frame}>
          <Text
            accessibilityLabel="Loading order"
            accessibilityRole="progressbar"
            style={styles.body}
          >
            Loading your order.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (order.error instanceof OrderNotFoundError || !order.data) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader
          back={{
            label: "Back",
            accessibilityLabel: "Back to orders",
            href: "/orders",
          }}
          showCart
        />
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Back to orders"
            body="We could not find that order. It may belong to another account."
            eyebrow="Order not found"
            onAction={() => router.replace("/orders")}
            title="No order to show here."
          />
        </View>
      </SafeAreaView>
    );
  }

  const detail = order.data;
  const emailNotice = emailStateLabel(detail.emailStatus);
  const payable =
    detail.paymentStatus === "awaiting_payment" ||
    detail.paymentStatus === "failed";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScreenHeader
        back={{
          label: "Back",
          accessibilityLabel: "Back to orders",
          href: "/orders",
        }}
        showCart
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Order</Text>
        <Text accessibilityRole="header" style={styles.orderNumber}>
          {detail.orderNumber}
        </Text>
        <Text style={styles.date}>{formatOrderDate(detail.createdAt)}</Text>

        <View style={styles.pills}>
          <StatusPill paymentState={detail.paymentStatus} />
          <View style={styles.pillGap} />
          <FulfillmentPill state={detail.fulfillmentStatus} />
        </View>

        <View style={styles.items}>
          {detail.items.map((item) => (
            <View
              key={`${item.productName}-${item.lineTotal.amountKobo}`}
              style={styles.item}
            >
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={item.productName}
                cachePolicy="memory-disk"
                contentFit="cover"
                source={{ uri: item.productImageUrl }}
                style={styles.thumbnail}
                transition={150}
              />
              <View style={styles.itemBody}>
                <Text maxFontSizeMultiplier={1.6} style={styles.itemName}>
                  {item.productName}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × {formatNgn(item.unitPrice.amountKobo)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatNgn(item.lineTotal.amountKobo)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatNgn(detail.subtotal.amountKobo)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery</Text>
            <Text style={styles.totalValue}>
              {formatNgn(detail.shipping.amountKobo)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>
              {formatNgn(detail.total.amountKobo)}
            </Text>
          </View>
        </View>

        <View style={styles.delivery}>
          <Text style={styles.sectionLabel}>Delivery</Text>
          <Text style={styles.deliveryBody}>
            {detail.delivery.name}
            {"\n"}
            {detail.delivery.addressLine1}
            {detail.delivery.addressLine2
              ? `\n${detail.delivery.addressLine2}`
              : ""}
            {"\n"}
            {detail.delivery.city}, {detail.delivery.state}{" "}
            {detail.delivery.postalCode}
            {"\n"}
            {detail.delivery.phone}
          </Text>
        </View>

        {emailNotice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{emailNotice}</Text>
          </View>
        ) : null}

        {payable ? (
          <PrimaryButton
            label="Continue payment"
            onPress={() =>
              router.push({
                pathname: "/payment/processing",
                params: { orderNumber: detail.orderNumber },
              })
            }
            style={styles.button}
          />
        ) : null}

        <PrimaryButton
          label="Continue shopping"
          onPress={() => router.replace("/")}
          style={styles.button}
        />
        <PrimaryButton
          label="All orders"
          onPress={() => router.replace("/orders")}
          style={styles.secondary}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5], justifyContent: "center" },
  content: {
    paddingHorizontal: space[5],
    paddingTop: space[8],
    paddingBottom: space[16],
  },
  body: { ...type.bodyLarge, color: colors.muted, fontFamily: fonts.sans },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  orderNumber: {
    ...type.displaySection,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[3],
  },
  date: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
  pills: { flexDirection: "row", marginTop: space[5] },
  pillGap: { width: space[2] },
  items: { marginTop: space[8] },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[4],
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.paperDeep,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: { ...type.body, color: colors.ink, fontFamily: fonts.sans },
  itemMeta: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[1],
  },
  itemTotal: {
    ...type.bodySmall,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
  },
  totals: { marginTop: space[8] },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: space[2],
  },
  totalLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  totalValue: { ...type.body, color: colors.ink, fontFamily: fonts.sans },
  grandLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  grandValue: { ...type.title, color: colors.ink, fontFamily: fonts.display },
  delivery: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space[8],
    paddingTop: space[5],
  },
  sectionLabel: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  deliveryBody: {
    ...type.body,
    color: colors.ink,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
  noticeBox: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space[4],
    marginTop: space[6],
  },
  noticeText: { ...type.bodySmall, color: colors.ink, fontFamily: fonts.sans },
  button: { marginTop: space[8] },
  secondary: { marginTop: space[3] },
});
