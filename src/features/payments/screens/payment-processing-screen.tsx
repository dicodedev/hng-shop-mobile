import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { colors, fonts, space, type } from "@/design/theme";
import { invalidateCart } from "@/features/cart/queries";
import { httpOrdersRepository } from "@/features/orders/orders-repository";
import {
  OrderNotFoundError,
  type PaymentStatus,
} from "@/features/orders/schema";
import {
  nextPollDecision,
  PAYMENT_POLL_WINDOW_MS,
  phaseForPaymentState,
  type PaymentPhase,
} from "@/features/payments/payment-state";

/**
 * Payment processing.
 *
 * The app returns here after the browser closes or the OS reopens it. It never
 * trusts the return link: it fetches authenticated payment status and renders
 * success only when the API reports `paid`.
 */
export function PaymentProcessingScreen({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<PaymentPhase>("verifying");
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef(0);
  // Initialized on first verification rather than during render.
  const startedAt = useRef<number | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    // A missing order number is handled during render, so this effect never
    // sets state synchronously.
    if (!accessToken || !orderNumber) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      startedAt.current ??= Date.now();
      try {
        const next = await httpOrdersRepository.getPaymentStatus(
          accessToken,
          orderNumber,
        );
        if (cancelled.current) return;

        setStatus(next);

        // A verified settlement may have removed ordered cart lines, so the
        // canonical cart must be refetched rather than cleared locally.
        if (next.paymentStatus === "paid") {
          invalidateCart(queryClient);
          setPhase("paid");
          return;
        }

        const decision = nextPollDecision(next.paymentStatus, attempt.current);
        if (!decision.shouldPoll) {
          if (decision.exhausted) setExhausted(true);
          setPhase(phaseForPaymentState(next.paymentStatus));
          return;
        }

        if (
          Date.now() - (startedAt.current ?? Date.now()) >=
          PAYMENT_POLL_WINDOW_MS
        ) {
          setExhausted(true);
          setPhase("pending");
          return;
        }

        attempt.current += 1;
        setPhase("verifying");
        timer = setTimeout(() => void verify(), decision.delayMs);
      } catch (caught) {
        if (cancelled.current) return;
        if (caught instanceof OrderNotFoundError) {
          setError("We could not find that order.");
        } else {
          // Verification may be temporarily unavailable. This is recoverable:
          // the webhook remains authoritative.
          setError("We could not confirm your payment yet.");
        }
        setPhase("recoverable_error");
      }
    };

    void verify();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [accessToken, orderNumber, queryClient]);

  if (!orderNumber) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader />
        <View style={styles.frame}>
          <Text style={styles.eyebrow}>Order unavailable</Text>
          <Text accessibilityRole="header" style={styles.headline}>
            We lost track of that order.
          </Text>
          <Text style={styles.body}>
            Open your orders to find it and continue payment.
          </Text>
          <PrimaryButton
            label="Back to orders"
            onPress={() => router.replace("/orders")}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "paid") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader />
        <View style={styles.frame}>
          <Text style={styles.eyebrow}>Payment confirmed</Text>
          <Text accessibilityRole="header" style={styles.headline}>
            Thank you.
          </Text>
          <Text style={styles.body}>
            Order {orderNumber} is paid. A confirmation will follow once your
            email is sent.
          </Text>
          <PrimaryButton
            label="View order"
            onPress={() =>
              router.replace({
                pathname: "/order/[orderNumber]",
                params: { orderNumber },
              })
            }
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.frame}>
        <Text style={styles.eyebrow}>Confirming your payment</Text>
        <Text accessibilityRole="header" style={styles.headline}>
          One moment.
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {error ??
            (exhausted
              ? "This is taking longer than usual. Your payment is still being confirmed."
              : "We are checking your payment with Paystack. Please keep this screen open.")}
        </Text>
        {status?.emailStatus === "failed" ? (
          <Text style={styles.notice}>
            Payment is confirmed, but the confirmation email could not be sent.
          </Text>
        ) : null}

        <PrimaryButton
          label="Check again"
          onPress={() => {
            attempt.current = 0;
            startedAt.current = Date.now();
            setExhausted(false);
            setError(null);
            router.replace({
              pathname: "/payment/processing",
              params: { orderNumber },
            });
          }}
          style={styles.button}
        />
        <PrimaryButton
          label="View order"
          onPress={() =>
            router.replace({
              pathname: "/order/[orderNumber]",
              params: { orderNumber },
            })
          }
          style={styles.secondary}
        />
        <Text style={styles.footnote}>
          Never pay twice. If you completed payment, we will confirm it here
          automatically.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5], justifyContent: "center" },
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
  body: {
    ...type.bodyLarge,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  notice: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[4],
  },
  button: { marginTop: space[8] },
  secondary: { marginTop: space[3] },
  footnote: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
    textAlign: "center",
  },
});
