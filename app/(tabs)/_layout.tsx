import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors, fonts } from "@/design/theme";
import { useCartItemCount } from "@/features/cart/queries";

const icons = {
  index: ["storefront-outline", "storefront"],
  cart: ["bag-handle-outline", "bag-handle"],
  orders: ["receipt-outline", "receipt"],
  account: ["person-outline", "person"],
} as const;

export default function TabLayout() {
  const itemCount = useCartItemCount();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
        },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const pair = icons[route.name as keyof typeof icons] ?? icons.index;
          return (
            <Ionicons color={color} name={pair[focused ? 1 : 0]} size={size} />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Shop" }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          // The badge exposes the numeric count, never colour alone.
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.paper,
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
