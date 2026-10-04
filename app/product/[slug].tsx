import { useLocalSearchParams } from "expo-router";

import { ProductScreen } from "@/features/catalogue/screens/product-screen";

export default function ProductRoute() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  return <ProductScreen slug={typeof slug === "string" ? slug : ""} />;
}
