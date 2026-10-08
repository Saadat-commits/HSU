import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useStoredScheme } from "@/src/appearance";
import { AuthProvider, useAuth } from "@/src/auth";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { LoadingView } from "@/src/components/ui";
import { I18nProvider, useI18n } from "@/src/i18n";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function Navigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingView label={t("loading")} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="grades" />
        <Stack.Screen name="mensa" />
        <Stack.Screen name="news" />
        <Stack.Screen name="exams" />
        <Stack.Screen name="flashcards" />
        <Stack.Screen name="decks/[deckId]" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useStoredScheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <I18nProvider>
              <AuthProvider>
                <StatusBar style="auto" />
                <Navigator />
              </AuthProvider>
            </I18nProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
