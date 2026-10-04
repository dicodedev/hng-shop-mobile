import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AppState, Platform } from "react-native";
import { useEffect, type PropsWithChildren } from "react";

import { AuthProvider } from "@/auth/session-provider";
import { CartSyncProvider } from "@/providers/cart-sync-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      // Never replay a mutation automatically. Order and payment flows carry
      // their own idempotency, and cart writes must not be queued.
      retry: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "HNG_SHOP_PUBLIC_QUERY_CACHE",
});

function LifecycleManager() {
  useEffect(() => {
    const networkSubscription = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(state.isConnected === true);
    });
    const appStateSubscription = AppState.addEventListener(
      "change",
      (status) => {
        if (Platform.OS !== "web") focusManager.setFocused(status === "active");
      },
    );

    return () => {
      networkSubscription();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          // Only public catalogue content is persisted. Auth, cart, checkout,
          // and order state must never be written to device storage.
          shouldDehydrateQuery: (query) => query.meta?.persist === true,
        },
      }}
    >
      <LifecycleManager />
      <AuthProvider>
        <CartSyncProvider />
        {children}
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
