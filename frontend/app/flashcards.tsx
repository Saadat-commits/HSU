import Ionicons from "@react-native-vector-icons/ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Deck, deckApi } from "@/src/api";
import {
  AppButton,
  Card,
  EmptyState,
  ErrorView,
  Field,
  LoadingView,
  Pill,
  ScreenHeader,
} from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { confirmAction, notify } from "@/src/utils/confirm";

const COUNTS = [5, 8, 12, 15];

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  deckIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
  },
  modalContent: { padding: spacing.lg, gap: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipText: { fontSize: 14, fontWeight: "700", color: colors.onSurfaceTertiary },
  chipTextActive: { color: colors.onBrandPrimary },
  hint: { fontSize: 13, color: colors.muted },
  flex: { flex: 1 },
}));

export default function Flashcards() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);

  const decks = useQuery<Deck[]>({ queryKey: ["decks"], queryFn: deckApi.list });

  const generate = useMutation({
    mutationFn: () => deckApi.generate(topic.trim(), count),
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setModalOpen(false);
      setTopic("");
      router.push(`/decks/${deck.deck_id}`);
    },
    onError: (error) => notify(t("errorTitle"), (error as Error).message),
  });

  const removeDeck = useMutation({
    mutationFn: deckApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decks"] }),
  });

  const items = decks.data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title={t("flashcards")}
        right={
          <TouchableOpacity
            testID="decks-add-button"
            onPress={() => setModalOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="add-circle" size={30} color={colors.brandPrimary} />
          </TouchableOpacity>
        }
      />
      {decks.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : decks.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => decks.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          {items.length === 0 ? (
            <>
              <Card>
                <EmptyState
                  icon="albums-outline"
                  title={t("noDecks")}
                  hint={t("noDecksHint")}
                />
              </Card>
              <AppButton
                testID="decks-empty-create-button"
                label={t("newDeck")}
                icon="sparkles"
                onPress={() => setModalOpen(true)}
              />
            </>
          ) : (
            items.map((deck) => (
              <Pressable
                key={deck.deck_id}
                testID={`deck-item-${deck.deck_id}`}
                onPress={() => router.push(`/decks/${deck.deck_id}`)}
              >
                <Card>
                  <View style={styles.row}>
                    <View style={styles.deckIcon}>
                      <Ionicons
                        name="albums"
                        size={20}
                        color={colors.brandPrimary}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.title}>{deck.title}</Text>
                      <Text style={styles.meta}>
                        {deck.card_count} {t("cards")} · {deck.known_count}{" "}
                        {t("mastered")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      testID={`deck-delete-${deck.deck_id}`}
                      onPress={() =>
                        confirmAction({
                          title: deck.title,
                          message: t("deleteConfirm"),
                          confirmLabel: t("delete"),
                          cancelLabel: t("cancel"),
                          onConfirm: () => removeDeck.mutate(deck.deck_id),
                        })
                      }
                      style={styles.iconButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            deck.card_count
                              ? (deck.known_count / deck.card_count) * 100
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={[styles.modalRoot, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("newDeck")}</Text>
            <TouchableOpacity
              testID="decks-modal-close"
              onPress={() => setModalOpen(false)}
              style={styles.iconButton}
            >
              <Ionicons name="close" size={26} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView
            bottomOffset={spacing.xl}
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + spacing.xxl },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              testID="decks-topic-input"
              label={t("deckTopic")}
              value={topic}
              onChangeText={setTopic}
              placeholder="Digitaltechnik: Zahlensysteme"
            />
            <View>
              <Text style={styles.label}>{t("deckCount")}</Text>
              <View style={styles.chipRow}>
                {COUNTS.map((value) => {
                  const active = count === value;
                  return (
                    <Pressable
                      key={value}
                      testID={`decks-count-${value}`}
                      onPress={() => setCount(value)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <AppButton
              testID="decks-generate-button"
              label={generate.isPending ? t("generating") : t("generate")}
              icon="sparkles"
              loading={generate.isPending}
              disabled={topic.trim().length < 3}
              onPress={() => generate.mutate()}
            />
            {generate.isPending ? (
              <View style={{ alignItems: "center" }}>
                <Pill>{t("generating")}</Pill>
              </View>
            ) : (
              <Text style={styles.hint}>{t("noDecksHint")}</Text>
            )}
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}
