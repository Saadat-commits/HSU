import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { aiApi, ChatMessage, streamChat } from "@/src/api";
import { EmptyState, ScreenHeader } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { confirmAction, notify } from "@/src/utils/confirm";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Bubble = { id: string; role: "user" | "assistant"; content: string };

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    borderBottomRightRadius: radius.sm,
    padding: spacing.md,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderBottomLeftRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textUser: { color: colors.onBrandPrimary, fontSize: 15, lineHeight: 21 },
  textAssistant: {
    color: colors.onSurfaceSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
  suggestions: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  suggestion: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 48,
    justifyContent: "center",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  typingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typingText: { color: colors.muted, fontSize: 13 },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default function Assistant() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const history = useQuery<ChatMessage[]>({
    queryKey: ["ai-messages"],
    queryFn: aiApi.messages,
  });

  useEffect(() => {
    if (history.data) {
      setBubbles(
        history.data.map((message) => ({
          id: message.message_id,
          role: message.role,
          content: message.content,
        })),
      );
    }
  }, [history.data]);

  const scrollToEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setInput("");
    setSending(true);
    const assistantId = `assistant-${Date.now()}`;
    setBubbles((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    scrollToEnd();

    try {
      await streamChat(message, (delta) => {
        setBubbles((current) =>
          current.map((bubble) =>
            bubble.id === assistantId
              ? { ...bubble, content: bubble.content + delta }
              : bubble,
          ),
        );
        scrollToEnd();
      });
      queryClient.invalidateQueries({ queryKey: ["ai-messages"] });
    } catch (error) {
      setBubbles((current) => current.filter((b) => b.id !== assistantId));
      notify(t("errorTitle"), (error as Error).message);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const clear = () => {
    confirmAction({
      title: t("clearChat"),
      message: t("deleteConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      onConfirm: async () => {
        await aiApi.clear();
        setBubbles([]);
        queryClient.invalidateQueries({ queryKey: ["ai-messages"] });
      },
    });
  };

  const suggestions = [t("suggestion1"), t("suggestion2"), t("suggestion3")];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title={t("assistantTitle")}
        showBack={false}
        right={
          bubbles.length > 0 ? (
            <TouchableOpacity
              testID="assistant-clear-button"
              onPress={clear}
              style={styles.headerButton}
            >
              <Ionicons name="trash-outline" size={22} color={colors.muted} />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <KeyboardAvoidingView
        behavior="translate-with-padding"
        keyboardVerticalOffset={spacing.lg}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {bubbles.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg }}>
              <EmptyState
                icon="sparkles-outline"
                title={t("assistantEmpty")}
              />
              <View style={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={suggestion}
                    testID={`assistant-suggestion-${index}`}
                    style={styles.suggestion}
                    onPress={() => send(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            bubbles.map((bubble) =>
              bubble.role === "user" ? (
                <View key={bubble.id} style={styles.bubbleUser}>
                  <Text style={styles.textUser}>{bubble.content}</Text>
                </View>
              ) : (
                <View key={bubble.id} style={styles.bubbleAssistant}>
                  {bubble.content ? (
                    <Text style={styles.textAssistant} testID="assistant-reply">
                      {bubble.content}
                    </Text>
                  ) : (
                    <View style={styles.typingRow}>
                      <ActivityIndicator
                        size="small"
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.typingText}>{t("thinking")}</Text>
                    </View>
                  )}
                </View>
              ),
            )
          )}
        </ScrollView>

        <View
          style={[
            styles.inputBar,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <TextInput
            testID="assistant-input"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t("assistantPlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity
            testID="assistant-send-button"
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendDisabled,
            ]}
            disabled={!input.trim() || sending}
            onPress={() => send(input)}
          >
            {sending ? (
              <ActivityIndicator color={colors.onBrandPrimary} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.onBrandPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
