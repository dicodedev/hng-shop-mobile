import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/session-provider";
import { Field } from "@/components/field";
import { EditorialState } from "@/components/editorial-state";
import { OrderSummaryPanel } from "@/components/order-summary";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { RegionPicker } from "@/components/region-picker";
import { colors, fonts, space, type } from "@/design/theme";
import { useCartQuery } from "@/features/cart/queries";
import { hasUnavailableItems } from "@/features/cart/schema";
import {
  acquireIdempotencyKey,
  clearIdempotencyKey,
} from "@/features/checkout/idempotency-store";
import {
  emptyDeliveryDraft,
  hasDeliveryErrors,
  NIGERIAN_REGIONS,
  toDeliveryPayload,
  validateDelivery,
  validateDeliveryField,
  type DeliveryDraft,
  type DeliveryErrors,
  type DeliveryField,
} from "@/features/checkout/delivery";
import { httpOrdersRepository } from "@/features/orders/orders-repository";
import { isValidAuthorizationUrl } from "@/features/payments/payment-return";

type SubmitPhase = "idle" | "creating_order" | "starting_payment";

export function CheckoutScreen() {
  const { status, accessToken } = useAuth();
  const cart = useCartQuery();
  const [draft, setDraft] = useState<DeliveryDraft>(emptyDeliveryDraft);
  const [errors, setErrors] = useState<DeliveryErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  // Guards against parallel submissions from rapid taps.
  const inFlight = useRef(false);
  // Mirrors `draft` so single-field validation always sees the latest value.
  const draftRef = useRef(draft);

  const busy = phase !== "idle";

  // Leaving checkout discards the delivery draft, which lives in component
  // state. Confirm first so a customer cannot silently lose their details.
  const draftIsDirty = Object.values(draft).some(
    (value) => value.trim().length > 0,
  );

  const leaveCheckout = useCallback(() => {
    if (!draftIsDirty || busy) {
      router.replace("/cart");
      return;
    }
    Alert.alert(
      "Discard your delivery details?",
      "Your progress on this checkout will be cleared. Your cart is not affected.",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.replace("/cart"),
        },
      ],
    );
  }, [draftIsDirty, busy]);

  const backTarget = {
    label: "Back",
    accessibilityLabel: "Back to cart",
    href: "/cart" as const,
    onPress: leaveCheckout,
  };

  const update = useCallback(
    (field: DeliveryField, value: string) => {
      const next = { ...draftRef.current, [field]: value };
      draftRef.current = next;
      setDraft(next);

      if (!submitted) return;
      const message = validateDeliveryField(field, next);
      setErrors((current) => {
        const nextErrors = { ...current };
        if (message) nextErrors[field] = message;
        else delete nextErrors[field];
        return nextErrors;
      });
    },
    [submitted],
  );

  const handleSubmit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitted(true);
    setFormError(null);

    const validation = validateDelivery(draft);
    setErrors(validation);
    if (hasDeliveryErrors(validation) || !accessToken) {
      inFlight.current = false;
      return;
    }

    const items = cart.data?.items ?? [];
    if (items.length === 0) {
      setFormError("Your cart is empty.");
      inFlight.current = false;
      return;
    }
    if (hasUnavailableItems(cart.data)) {
      setFormError(
        "A piece in your cart is no longer available. Remove it before checking out.",
      );
      inFlight.current = false;
      return;
    }

    try {
      setPhase("creating_order");
      // One idempotency key is retained across retries of this attempt.
      const idempotencyKey = await acquireIdempotencyKey();
      const order = await httpOrdersRepository.createOrder(
        accessToken,
        toDeliveryPayload(draft),
        idempotencyKey,
      );

      // The order now exists; the key must not be reused for a new order.
      await clearIdempotencyKey();

      setPhase("starting_payment");
      let authorizationUrl: string | null = null;
      try {
        const session = await httpOrdersRepository.createPaymentSession(
          accessToken,
          order.orderNumber,
          await acquireIdempotencyKey(),
        );
        authorizationUrl = session.authorizationUrl;
      } catch {
        // The order is saved even when payment initialization fails. Preserve
        // the order number and route to a recoverable state.
        router.push({
          pathname: "/payment/result",
          params: { orderNumber: order.orderNumber, state: "session_failed" },
        });
        return;
      }

      if (!authorizationUrl || !isValidAuthorizationUrl(authorizationUrl)) {
        router.push({
          pathname: "/payment/result",
          params: { orderNumber: order.orderNumber, state: "session_failed" },
        });
        return;
      }

      await WebBrowser.openAuthSessionAsync(authorizationUrl, undefined);
      router.replace({
        pathname: "/payment/processing",
        params: { orderNumber: order.orderNumber },
      });
    } catch {
      setFormError("We could not start your order. Please try again.");
      setPhase("idle");
    } finally {
      inFlight.current = false;
    }
  };

  if (status !== "authenticated") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader back={backTarget} />
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Sign in"
            body="Checkout needs your account so your cart and order stay together."
            eyebrow="Sign in to continue"
            onAction={() =>
              router.replace({
                pathname: "/auth/sign-in",
                params: { intent: "cart" },
              })
            }
            title="Almost there."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (cart.isPending) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader back={backTarget} />
        <View style={styles.frame}>
          <Text
            accessibilityLabel="Loading checkout"
            accessibilityRole="progressbar"
            style={styles.loading}
          >
            Preparing your order.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = cart.data?.items ?? [];

  if (items.length === 0 && !cart.isError) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScreenHeader back={backTarget} />
        <View style={styles.frame}>
          <EditorialState
            actionLabel="Browse the collection"
            body="Add a piece to your cart and it will appear here."
            eyebrow="Empty cart"
            onAction={() => router.replace("/")}
            title="There is nothing to check out yet."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScreenHeader back={backTarget} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text accessibilityRole="header" style={styles.headline}>
            Delivery details
          </Text>
          <Text style={styles.supporting}>
            We deliver across Nigeria. Your details are used only to fulfil this
            order.
          </Text>

          <OrderSummaryPanel cart={cart.data!} />

          <View style={styles.form}>
            <Field
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
              label="Full name"
              onChangeText={(value) => update("name", value)}
              onBlur={() => update("name", draft.name)}
              returnKeyType="next"
              value={draft.name}
            />
            <Field
              autoComplete="tel"
              error={errors.phone}
              hint="Nigerian mobile number"
              keyboardType="phone-pad"
              label="Phone"
              onBlur={() => update("phone", draft.phone)}
              onChangeText={(value) => update("phone", value)}
              returnKeyType="next"
              value={draft.phone}
            />
            <Field
              autoCapitalize="words"
              error={errors.addressLine1}
              label="Address line 1"
              onBlur={() => update("addressLine1", draft.addressLine1)}
              onChangeText={(value) => update("addressLine1", value)}
              returnKeyType="next"
              value={draft.addressLine1}
            />
            <Field
              autoCapitalize="words"
              error={errors.addressLine2}
              hint="Optional"
              label="Address line 2 or landmark"
              onBlur={() => update("addressLine2", draft.addressLine2)}
              onChangeText={(value) => update("addressLine2", value)}
              returnKeyType="next"
              value={draft.addressLine2}
            />
            <Field
              autoCapitalize="words"
              error={errors.city}
              label="City"
              onBlur={() => update("city", draft.city)}
              onChangeText={(value) => update("city", value)}
              returnKeyType="next"
              value={draft.city}
            />
            <RegionPicker
              error={errors.state}
              onSelect={(region) => update("state", region)}
              regions={NIGERIAN_REGIONS}
              value={draft.state}
            />
            <Field
              error={errors.postalCode}
              hint="6 digits"
              keyboardType="number-pad"
              label="Postal code"
              maxLength={6}
              onBlur={() => update("postalCode", draft.postalCode)}
              onChangeText={(value) =>
                update("postalCode", value.replace(/\D/g, ""))
              }
              returnKeyType="done"
              value={draft.postalCode}
            />
          </View>

          {formError ? (
            <Text accessibilityLiveRegion="polite" style={styles.formError}>
              {formError}
            </Text>
          ) : null}

          <PrimaryButton
            disabled={busy || !accessToken}
            label={
              phase === "creating_order"
                ? "Creating order"
                : phase === "starting_payment"
                  ? "Opening payment"
                  : "Continue to payment"
            }
            onPress={() => void handleSubmit()}
            style={styles.submit}
          />
          <Text style={styles.footnote}>
            Your card is handled by Paystack. HNG Shop never sees your card
            details.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  frame: { flex: 1, paddingHorizontal: space[5], justifyContent: "center" },
  content: {
    paddingHorizontal: space[5],
    paddingTop: space[8],
    paddingBottom: space[16],
  },
  loading: { ...type.bodyLarge, color: colors.muted, fontFamily: fonts.sans },
  headline: {
    ...type.displaySection,
    color: colors.ink,
    fontFamily: fonts.display,
  },
  supporting: {
    ...type.body,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
  },
  form: { marginTop: space[8] },
  formError: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginBottom: space[4],
  },
  submit: { marginTop: space[6] },
  footnote: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[3],
    textAlign: "center",
  },
});
