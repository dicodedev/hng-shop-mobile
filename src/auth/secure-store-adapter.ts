import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

/**
 * SecureStore-backed Supabase storage adapter.
 *
 * Auth tokens must never be written to AsyncStorage, logs, or the persisted
 * query cache. Values are chunked because iOS keychain entries are size limited.
 */
const MAX_CHUNK_LENGTH = 2048;

export const secureStoreAdapter: SupportedStorage = {
  getItem: async (key) => {
    const combined = await SecureStore.getItemAsync(key);
    if (combined === null) return null;

    if (!combined.startsWith("hngshop-chunked:")) return combined;

    const count = Number(combined.slice("hngshop-chunked:".length));
    if (!Number.isInteger(count) || count <= 1) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(`${key}.chunk.${index}`),
      ),
    );
    if (chunks.some((chunk) => chunk === null)) return null;
    SecureStore.deleteItemAsync(key);
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.deleteItemAsync(`${key}.chunk.${index}`),
      ),
    );
    return chunks.join("");
  },

  setItem: async (key, value) => {
    if (value.length <= MAX_CHUNK_LENGTH) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return;
    }

    const chunks =
      value.match(new RegExp(`.{1,${MAX_CHUNK_LENGTH}}`, "g")) ?? [];
    await SecureStore.setItemAsync(key, `hngshop-chunked:${chunks.length}`, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(`${key}.chunk.${index}`, chunk, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
      ),
    );
  },

  removeItem: async (key) => {
    await SecureStore.deleteItemAsync(key);
    const existing = await SecureStore.getItemAsync(key);
    if (existing?.startsWith("hngshop-chunked:")) {
      const count = Number(existing.slice("hngshop-chunked:".length));
      await Promise.all(
        Array.from({ length: count }, (_, index) =>
          SecureStore.deleteItemAsync(`${key}.chunk.${index}`),
        ),
      );
    }
  },
};
