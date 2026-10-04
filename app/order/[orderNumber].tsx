import { useLocalSearchParams } from "expo-router";

import { OrderDetailScreen } from "@/features/orders/screens/order-detail-screen";

export default function OrderRoute() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  return (
    <OrderDetailScreen
      orderNumber={typeof orderNumber === "string" ? orderNumber : ""}
    />
  );
}
