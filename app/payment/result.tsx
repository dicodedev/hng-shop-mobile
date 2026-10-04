import { useLocalSearchParams } from "expo-router";

import { PaymentResultScreen } from "@/features/payments/screens/payment-result-screen";

export default function PaymentResultRoute() {
  const { orderNumber, state } = useLocalSearchParams<{
    orderNumber?: string;
    state?: string;
  }>();
  return (
    <PaymentResultScreen
      orderNumber={typeof orderNumber === "string" ? orderNumber : ""}
      state={typeof state === "string" ? state : undefined}
    />
  );
}
