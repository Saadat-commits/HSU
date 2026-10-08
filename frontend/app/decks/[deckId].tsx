import Ionicons from "@react-native-vector-icons/ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Deck, deckApi, Flashcard } from "@/src/api";
import {
  AppButton,
  Card,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenHeader,
} from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressText: { fontSize: 13, fontWeight: "700", color: colors.muted },
  cardFace: {
    minHeight: 220,
    justifyContent: "center",
    gap: spacing.md,
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 28,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.brandPrimary,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceSecondary,
  },
  tapHint: { fontSize: 13, color: colors.muted, textAlign: "center" },
  actions: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  doneWrap: { gap: spacing.lg, paddingTop: spacing.xl },
}));

export default function DeckStudy() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const deck = useQuery<{ deck: Deck; cards: Flashcard[] }>({
    queryKey: ["deck", deckId],
    queryFn: () => deckApi.get(deckId),
    enabled: !!deckId,
  });

  const mark = useMutation({
    mutationFn: ({ cardId, known }: { cardId: string; known: boolean }) =>
      deckApi.setCardState(deckId, cardId, known),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
    },
  });

  if (deck.isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        <ScreenHeader title={t("flashcards")} />
        <LoadingView label={t("loading")} />
      </View>
    );
  }

  if (deck.isError || !deck.data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        <ScreenHeader title={t("flashcards")} />
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => deck.refetch()}
        />
      </View>
    );
  }

  const cards = deck.data.cards;
  const current = cards[index];

  const next = (known: boolean) => {
    if (!current) return;
    mark.mutate({ cardId: current.card_id, known });
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader title={deck.data.deck.title} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        {cards.length === 0 ? (
          <Card>
            <EmptyState icon="albums-outline" title={t("noDecks")} />
          </Card>
        ) : current ? (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {index + 1} / {cards.length}
              </Text>
              <Text style={styles.progressText}>
                {deck.data.deck.known_count} {t("mastered")}
              </Text>
            </View>

            <Pressable
              testID="deck-card"
              onPress={() => setRevealed((value) => !value)}
            >
              <Card style={styles.cardFace}>
                <Text style={styles.question}>{current.question}</Text>
                {revealed ? (
                  <>
                    <Text style={styles.answerLabel}>{t("answer")}</Text>
                    <Text style={styles.answer} testID="deck-card-answer">
                      {current.answer}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.tapHint}>{t("showAnswer")}</Text>
                )}
              </Card>
            </Pressable>

            {revealed ? (
              <View style={styles.actions}>
                <AppButton
                  testID="deck-again-button"
                  label={t("didntKnow")}
                  variant="secondary"
                  style={styles.flex}
                  onPress={() => next(false)}
                />
                <AppButton
                  testID="deck-known-button"
                  label={t("knewIt")}
                  style={styles.flex}
                  onPress={() => next(true)}
                />
              </View>
            ) : (
              <AppButton
                testID="deck-reveal-button"
                label={t("showAnswer")}
                icon="eye-outline"
                onPress={() => setRevealed(true)}
              />
            )}
          </>
        ) : (
          <View style={styles.doneWrap}>
            <EmptyState
              icon="checkmark-done-outline"
              title={t("deckDone")}
              hint={`${deck.data.deck.known_count} / ${cards.length} ${t("mastered")}`}
            />
            <AppButton
              testID="deck-restart-button"
              label={t("restart")}
              icon="refresh-outline"
              onPress={() => {
                setIndex(0);
                setRevealed(false);
              }}
            />
          </View>
        )}
      </ScrollView>
      {mark.isPending ? (
        <View style={{ position: "absolute", top: insets.top, right: spacing.lg }}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.muted} />
        </View>
      ) : null}
    </View>
  );
}
