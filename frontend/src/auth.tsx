import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import {
  authApi,
  clearToken,
  loadToken,
  saveToken,
  setUnauthorizedHandler,
  User,
} from "@/src/api";

WebBrowser.maybeCompleteAuthSession();

const AUTH_PORTAL = "https://auth.emergentagent.com/";

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthValue>(null as never);

function extractSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?#&]session_id=([^&#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function redirectUrl(): string {
  if (Platform.OS === "web") return window.location.origin + "/";
  return Linking.createURL("");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const handled = useRef<Set<string>>(new Set());

  const exchangeSession = useCallback(async (sessionId: string) => {
    if (handled.current.has(sessionId)) return;
    handled.current.add(sessionId);
    const result = await authApi.googleSession(sessionId);
    await saveToken(result.session_token);
    setUser(result.user);
    if (Platform.OS === "web") {
      const clean = window.location.pathname + window.location.search;
      window.history.replaceState(window.history.state, "", clean);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const initialUrl =
          Platform.OS === "web"
            ? window.location.href
            : await Linking.getInitialURL();
        const sessionId = extractSessionId(initialUrl);
        if (sessionId) {
          await exchangeSession(sessionId);
          return;
        }
        const stored = await loadToken();
        if (stored) {
          const me = await authApi.me();
          if (mounted) setUser(me);
        }
      } catch {
        await clearToken();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      const sessionId = extractSessionId(url);
      if (sessionId) exchangeSession(sessionId).catch(() => {});
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [exchangeSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email.trim().toLowerCase(), password);
    await saveToken(result.access_token);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await authApi.register(
        email.trim().toLowerCase(),
        password,
        name.trim(),
      );
      await saveToken(result.access_token);
      setUser(result.user);
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    const redirect = redirectUrl();
    const authUrl = `${AUTH_PORTAL}?redirect=${encodeURIComponent(redirect)}`;

    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return;
    }

    let captured: string | null = null;
    const listener = Linking.addEventListener("url", ({ url }) => {
      captured = url;
    });
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
      const fromResult =
        result.type === "success" ? (result as { url?: string }).url : null;
      const sessionId =
        extractSessionId(fromResult) ??
        extractSessionId(captured) ??
        extractSessionId(await Linking.getInitialURL());
      if (sessionId) await exchangeSession(sessionId);
    } finally {
      listener.remove();
    }
  }, [exchangeSession]);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, logout, setUser }),
    [user, loading, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
