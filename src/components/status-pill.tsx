import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space, type } from "@/design/theme";
import type { FulfillmentState, PaymentState } from "@/api/dto";
import {
  fulfillmentStateLabel,
  paymentStateLabel,
} from "@/features/payments/payment-state";

type Tone = "paid" | "failed" | "neutral" | "outlined";

function toneForPayment(state: PaymentState): Tone {
  if (state === "paid") return "paid";
  if (state === "failed") return "failed";
  return "neutral";
}

/**
 * Status pill.
 *
 * A text label is always present: colour is never the only signal.
 */
export function StatusPill({ paymentState }: { paymentState: PaymentState }) {
  const tone = toneForPayment(paymentState);
  return (
    <View
      style={[
        styles.pill,
        tone === "paid" && styles.paid,
        tone === "failed" && styles.failed,
        tone === "neutral" && styles.neutral,
      ]}
    >
      <Text
        accessibilityLabel={`Payment status: ${paymentStateLabel(paymentState)}`}
        style={[
          styles.label,
          tone === "paid" || tone === "failed"
            ? styles.onDark
            : styles.onNeutral,
        ]}
      >
        {paymentStateLabel(paymentState)}
      </Text>
    </View>
  );
}

export function FulfillmentPill({ state }: { state: FulfillmentState }) {
  return (
    <View style={[styles.pill, styles.neutral]}>
      <Text
        accessibilityLabel={`Fulfilment status: ${fulfillmentStateLabel(state)}`}
        style={[styles.label, styles.onNeutral]}
      >
        {fulfillmentStateLabel(state)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  paid: { backgroundColor: colors.moss },
  failed: { backgroundColor: colors.accent },
  neutral: { backgroundColor: colors.paperDeep },
  label: {
    ...type.badge,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  onDark: { color: colors.paper },
  onNeutral: { color: colors.ink },
});
