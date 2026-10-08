import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import {
  Card,
  EmptyState,
  LoadingView,
  Pill,
  SectionTitle,
} from "@/src/components/ui";
import {
  campusApi,
  Exam,
  FavoriteMatch,
  GradesResponse,
  ScheduleEntry,
} from "@/src/api";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { daysUntil, formatDay } from "@/src/utils/countdown";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.xl },
  greeting: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "800", color: colors.onSurface },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1 },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  quickItem: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 96,
    justifyContent: "center",
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  aiCard: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  aiTitle: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "800" },
  aiHint: { color: colors.onBrandPrimary, fontSize: 13, opacity: 0.85 },
  classRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  timeBox: {
    width: 60,
    alignItems: "center",
  },
  timeText: { fontSize: 15, fontWeight: "800", color: colors.onSurface },
  timeEnd: { fontSize: 12, color: colors.muted },
  classTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  classMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  examRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  countdown: {
    minWidth: 58,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
  },
  countdownUrgent: { backgroundColor: colors.brandPrimary },
  countdownValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  countdownValueUrgent: { color: colors.onBrandPrimary },
  countdownUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  countdownUnitUrgent: { color: colors.onBrandPrimary },
  favoriteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  favoriteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  favoriteName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onBrandTertiary,
    marginTop: 2,
  },
}));

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 11) return "goodMorning" as const;
  if (hour < 18) return "goodAfternoon" as const;
  return "goodEvening" as const;
}

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const schedule = useQuery<ScheduleEntry[]>({
    queryKey: ["schedule"],
    queryFn: campusApi.schedule,
  });
  const grades = useQuery<GradesResponse>({
    queryKey: ["grades"],
    queryFn: campusApi.grades,
  });
  const exams = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: campusApi.exams,
  });
  const favorites = useQuery<{ favorites: string[]; upcoming: FavoriteMatch[] }>({
    queryKey: ["mensa-favorites"],
    queryFn: campusApi.favorites,
  });

  const weekday = (new Date().getDay() + 6) % 7;
  const todayClasses = (schedule.data ?? []).filter(
    (entry) => entry.weekday === weekday,
  );

  const quickLinks: { label: string; icon: IconName; href: string; testID: string }[] = [
    { label: t("grades"), icon: "ribbon-outline", href: "/grades", testID: "quick-grades" },
    { label: t("exams"), icon: "school-outline", href: "/exams", testID: "quick-exams" },
    { label: t("flashcards"), icon: "albums-outline", href: "/flashcards", testID: "quick-flashcards" },
    { label: t("mensa"), icon: "restaurant-outline", href: "/mensa", testID: "quick-mensa" },
    { label: t("news"), icon: "newspaper-outline", href: "/news", testID: "quick-news" },
    { label: t("settings"), icon: "settings-outline", href: "/settings", testID: "quick-settings" },
  ];

  const nextExams = (exams.data ?? []).slice(0, 3);
  const todayIso = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
  })();
  const favoriteMatch = (favorites.data?.upcoming ?? [])[0];

  const refreshing =
    schedule.isFetching ||
    grades.isFetching ||
    exams.isFetching ||
    favorites.isFetching;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            schedule.refetch();
            grades.refetch();
            exams.refetch();
            favorites.refetch();
          }}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <View>
        <Text style={styles.greeting}>{t(greetingKey())}</Text>
        <Text style={styles.name} testID="home-user-name">
          {user?.name ?? t("welcome")}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {grades.data?.average != null
              ? grades.data.average.toFixed(2)
              : "–"}
          </Text>
          <Text style={styles.statLabel}>{t("average")}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{grades.data?.total_ects ?? 0}</Text>
          <Text style={styles.statLabel}>{t("ects")}</Text>
        </Card>
      </View>

      {nextExams.length > 0 ? (
        <View>
          <SectionTitle>{t("upcomingExams")}</SectionTitle>
          <TouchableOpacity
            testID="home-exams-card"
            activeOpacity={0.9}
            onPress={() => router.push("/exams")}
          >
            <Card>
              {nextExams.map((exam, index) => {
                const days = daysUntil(exam.date);
                const urgent = days <= 7;
                return (
                  <View key={exam.exam_id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.examRow}>
                      <View
                        style={[
                          styles.countdown,
                          urgent && styles.countdownUrgent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.countdownValue,
                            urgent && styles.countdownValueUrgent,
                          ]}
                        >
                          {days <= 0 ? "0" : days}
                        </Text>
                        <Text
                          style={[
                            styles.countdownUnit,
                            urgent && styles.countdownUnitUrgent,
                          ]}
                        >
                          {days === 1 ? t("dayLeft") : t("daysLeft")}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.classTitle}>{exam.title}</Text>
                        <Text style={styles.classMeta}>
                          {formatDay(exam.date, lang)} · {exam.start_time}
                          {exam.location ? ` · ${exam.location}` : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          </TouchableOpacity>
        </View>
      ) : null}

      {favoriteMatch ? (
        <TouchableOpacity
          testID="home-favorite-card"
          activeOpacity={0.9}
          style={styles.favoriteCard}
          onPress={() => router.push("/mensa")}
        >
          <Ionicons name="heart" size={22} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.favoriteLabel}>
              {favoriteMatch.date === todayIso
                ? t("favoriteToday")
                : `${t("favoriteSoon")} ${formatDay(favoriteMatch.date, lang)}`}
            </Text>
            <Text style={styles.favoriteName}>{favoriteMatch.name}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.brandPrimary}
          />
        </TouchableOpacity>
      ) : null}

      <View>
        <SectionTitle>{t("quickLinks")}</SectionTitle>
        <View style={styles.quickGrid}>
          {quickLinks.map((link) => (
            <TouchableOpacity
              key={link.href}
              testID={link.testID}
              activeOpacity={0.85}
              style={styles.quickItem}
              onPress={() => router.push(link.href as never)}
            >
              <View style={styles.quickIcon}>
                <Ionicons
                  name={link.icon}
                  size={20}
                  color={colors.brandPrimary}
                />
              </View>
              <Text style={styles.quickLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        testID="home-assistant-cta"
        activeOpacity={0.9}
        style={styles.aiCard}
        onPress={() => router.push("/(tabs)/assistant")}
      >
        <Ionicons name="sparkles" size={26} color={colors.onBrandPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>{t("openAssistant")}</Text>
          <Text style={styles.aiHint}>{t("openAssistantHint")}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.onBrandPrimary}
        />
      </TouchableOpacity>

      <View>
        <SectionTitle>{t("todayClasses")}</SectionTitle>
        {schedule.isLoading ? (
          <Card>
            <LoadingView />
          </Card>
        ) : todayClasses.length === 0 ? (
          <Card>
            <EmptyState
              icon="cafe-outline"
              title={t("noClassesToday")}
              hint={t("noClassesTodayHint")}
            />
          </Card>
        ) : (
          <Card>
            {todayClasses.map((entry, index) => (
              <View key={entry.entry_id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.classRow}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeText}>{entry.start_time}</Text>
                    <Text style={styles.timeEnd}>{entry.end_time}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classTitle}>{entry.title}</Text>
                    <Text style={styles.classMeta}>
                      {[entry.location, entry.professor]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                  <Pill>{entry.type}</Pill>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
