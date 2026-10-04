import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import { getAuthRedirectUrl, isAuthConfigured } from "@/auth/config";
import { extractAuthorizationCode } from "@/auth/redirect-state";
import { getSupabaseClient } from "@/auth/supabase";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  userId: string | null;
  accessToken: string | null;
  configured: boolean;
  signInWithGoogle: () => Promise<"signed-in" | "cancelled" | "failed">;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isAuthConfigured();
  const [session, setSession] = useState<Session | null>(null);
  // Without public configuration there is no session to resolve, so the app
  // starts anonymous instead of flashing a loading state.
  const [status, setStatus] = useState<AuthStatus>(() =>
    isAuthConfigured() ? "loading" : "anonymous",
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "anonymous");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setStatus(nextSession ? "authenticated" : "anonymous");
      },
    );

    // Refresh the session when the app returns to the foreground so a
    // backgrounded customer is not left with an expired access token.
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") void supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return "failed";

    const redirectTo = getAuthRedirectUrl();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) return "failed";

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type !== "success") return "cancelled";

      const code = extractAuthorizationCode(result.url);
      if (!code) return "failed";

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      return exchangeError ? "failed" : "signed-in";
    } catch {
      return "failed";
    } finally {
      // Always dismiss the in-app browser so a failed attempt cannot leave the
      // customer stuck in a payment-like overlay.
      WebBrowser.dismissAuthSession?.();
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    // Signing out clears local session state only. The account cart lives in
    // Supabase and must never be deleted here.
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      userId: session?.user.id ?? null,
      accessToken: session?.access_token ?? null,
      configured,
      signInWithGoogle,
      signOut,
    }),
    [status, session, configured, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
