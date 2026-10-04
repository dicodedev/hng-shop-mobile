import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { EditorialState } from "@/components/editorial-state";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { colors, fonts, radius, space, type } from "@/design/theme";
import { httpOrdersRepository } from "@/features/orders/orders-repository";
import {
  OrderNotFoundError,
  type PaymentStatus,
} from "@/features/orders/schema";
import {
  emailStateLabel,
  paymentStateLabel,
} from "@/features/payments/payment-state";

/**
 * Payment result.
 *
 * Handles the deep-link return and the case where an order exists but hosted
 * payment could not start. A return link is navigation only: this screen always
 * reads the authoritative persisted state.
 */
export function PaymentResultScreen({
  orderNumber,
  state,
}: {
  orderNumber: string;
  state?: string;
}) {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A missing access token is handled during render, so this effect never
    // sets state synchronously.
    if (!accessToken) return;

    let active = true;

    void httpOrdersRepository
      .getPaymentStatus(accessToken, orderNumber)
      .then((next) => {
        if (!active) return;
        setStatus(next);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof OrderNotFoundError
            ? "We could not find that order."
            : null,
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, orderNumber]);

  if (!accessToken || loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader />
        <View style={styles.frame}>
          <Text
            accessibilityLabel="Loading payment status"
            accessibilityRole="progressbar"
            style={styles.body}
          >
            Checking your order.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !status) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader />
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Back to orders"
            body="We could not read this order right now. Your order is safe and support can find it with this order number."
            eyebrow="Order unavailable"
            onAction={() => router.replace("/orders")}
            title="Something interrupted us."
          />
          <Text style={styles.orderNumber}>{orderNumber}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const paid = status.paymentStatus === "paid";
  const emailNotice = emailStateLabel(status.emailStatus);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          {paid ? "Payment confirmed" : paymentStateLabel(status.paymentStatus)}
        </Text>
        <Text accessibilityRole="header" style={styles.headline}>
          {paid ? "Thank you." : "Your order is saved."}
        </Text>

        <View style={styles.statusRow}>
          <StatusPill paymentState={status.paymentStatus} />
        </View>

        <Text style={styles.body}>
          Order {status.orderNumber}
          {paid
            ? " is paid."
            : " is awaiting payment. You can continue to Paystack or come back and check again."}
        </Text>

        {emailNotice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{emailNotice}</Text>
          </View>
        ) : null}

        {state === "session_failed" ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              We saved your order but could not open payment. Please try again.
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label={paid ? "View order" : "Check again"}
          onPress={() =>
            router.replace(
              paid
                ? {
                    pathname: "/order/[orderNumber]",
                    params: { orderNumber: status.orderNumber },
                  }
                : {
                    pathname: "/payment/processing",
                    params: { orderNumber: status.orderNumber },
                  },
            )
          }
          style={styles.button}
        />
        <PrimaryButton
          label="Back to orders"
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
    paddingTop: space[10],
    paddingBottom: space[16],
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headline: {
    ...type.displaySection,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[4],
  },
  statusRow: { flexDirection: "row", marginTop: space[5] },
  body: {
    ...type.bodyLarge,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
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
  orderNumber: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    textAlign: "center",
    marginTop: space[6],
  },
});
