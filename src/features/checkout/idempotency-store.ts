import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "HNG_SHOP_PENDING_IDEMPOTENCY_KEY";
const MAX_AGE_MS = 60 * 60 * 1000;

type StoredKey = { key: string; createdAt: number };

/**
 * Order-creation idempotency.
 *
 * One UUID is retained across timeout and retry so a replayed request cannot
 * create a second order. The key is replaced only after a definitive order
 * response or explicit abandonment. This holds a non-sensitive correlation
 * value, which is permitted in AsyncStorage; it is never a token or PII.
 */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}

function isUsable(value: unknown): value is StoredKey {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoredKey>;
  return (
    typeof candidate.key === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      candidate.key,
    ) &&
    typeof candidate.createdAt === "number"
  );
}

/** Returns the retained key for this checkout attempt, creating one if needed. */
export async function acquireIdempotencyKey(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isUsable(parsed) && Date.now() - parsed.createdAt < MAX_AGE_MS)
        return parsed.key;
    }
  } catch {
    // Fall through and mint a fresh key.
  }

  const key = newIdempotencyKey();
  await persist(key);
  return key;
}

async function persist(key: string): Promise<void> {
  const payload: StoredKey = { key, createdAt: Date.now() };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // A non-persisted key still protects in-session retries.
  }
}

/** Called once the order response is definitive. */
export async function clearIdempotencyKey(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; a stale key expires on its own.
  }
}
