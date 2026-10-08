import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { campusApi, NewsItem } from "@/src/api";
import {
  AppButton,
  Card,
  EmptyState,
  ErrorView,
  LoadingView,
  Pill,
  ScreenHeader,
} from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    height: 220,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.onSurfaceInverse,
    fontSize: 20,
    fontWeight: "800",
  },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  modalRoot: { flex: 1, backgroundColor: colors.surface },
  modalContent: { padding: spacing.lg, gap: spacing.lg },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  body: { fontSize: 15, lineHeight: 23, color: colors.onSurfaceSecondary },
}));

function formatDate(iso: string, lang: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function News() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const news = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: campusApi.news,
  });

  const items = news.data ?? [];
  const [hero, ...rest] = items;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader title={t("newsTitle")} />
      {news.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : news.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => news.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="newspaper-outline" title={t("noNews")} />
        </Card>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          <Pressable
            testID="news-hero"
            style={styles.hero}
            onPress={() => setSelected(hero)}
          >
            <Image
              source={{ uri: hero.image_url }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={["transparent", "rgba(28,28,30,0.9)"]}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <View style={{ alignSelf: "flex-start" }}>
                <Pill>{hero.category}</Pill>
              </View>
              <Text style={styles.heroTitle}>{hero.title}</Text>
            </View>
          </Pressable>

          {rest.map((item) => (
            <Pressable
              key={item.news_id}
              testID={`news-item-${item.news_id}`}
              onPress={() => setSelected(item)}
            >
              <Card>
                <View style={styles.row}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>
                      {item.category} · {formatDate(item.published_at, lang)}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={[styles.modalRoot, { paddingTop: insets.top + spacing.sm }]}>
          <ScrollView
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + spacing.xxl },
            ]}
          >
            {selected ? (
              <>
                <Image
                  source={{ uri: selected.image_url }}
                  style={styles.modalImage}
                  contentFit="cover"
                />
                <View style={{ alignSelf: "flex-start" }}>
                  <Pill>{selected.category}</Pill>
                </View>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.meta}>
                  {formatDate(selected.published_at, lang)}
                </Text>
                <Text style={styles.body}>{selected.body}</Text>
              </>
            ) : null}
            <AppButton
              testID="news-close-button"
              label={t("close")}
              variant="secondary"
              onPress={() => setSelected(null)}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
