import { useLocalSearchParams } from "expo-router";

import { PaymentProcessingScreen } from "@/features/payments/screens/payment-processing-screen";

export default function PaymentProcessingRoute() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  return (
    <PaymentProcessingScreen
      orderNumber={typeof orderNumber === "string" ? orderNumber : ""}
    />
  );
}
