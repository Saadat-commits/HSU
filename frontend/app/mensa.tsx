import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { campusApi, Meal } from "@/src/api";
import {
  Card,
  EmptyState,
  ErrorView,
  LoadingView,
  Pill,
  ScreenHeader,
} from "@/src/components/ui";
import { useI18n, WEEKDAYS } from "@/src/i18n";
import { makeStyles, radius, spacing } from "@/src/theme";

function weekDates(): Date[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  dayRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  dayChip: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  dayLabel: { fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary },
  dayNumber: { fontSize: 11, color: colors.muted },
  dayLabelActive: { color: colors.onBrandPrimary },
  content: { padding: spacing.lg, gap: spacing.md },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  mealName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  priceRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  pricePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
  },
  priceText: { fontSize: 12, fontWeight: "700", color: colors.onSurfaceTertiary },
  tagRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
}));

export default function Mensa() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const dates = weekDates();
  const [selected, setSelected] = useState(
    Math.min((new Date().getDay() + 6) % 7, 4),
  );
  const day = toIso(dates[selected]);

  const menu = useQuery<{ date: string; meals: Meal[] }>({
    queryKey: ["mensa", day],
    queryFn: () => campusApi.mensa(day),
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader title={t("mensaTitle")} />
      <View style={styles.dayRow}>
        {dates.map((date, index) => {
          const active = index === selected;
          return (
            <Pressable
              key={index}
              testID={`mensa-day-${index}`}
              onPress={() => setSelected(index)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {WEEKDAYS[lang][index]}
              </Text>
              <Text style={[styles.dayNumber, active && styles.dayLabelActive]}>
                {date.getDate()}.
              </Text>
            </Pressable>
          );
        })}
      </View>

      {menu.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : menu.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => menu.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          {(menu.data?.meals ?? []).length === 0 ? (
            <Card>
              <EmptyState
                icon="restaurant-outline"
                title={t("mensaClosed")}
                hint={t("mensaClosedHint")}
              />
            </Card>
          ) : (
            (menu.data?.meals ?? []).map((meal) => (
              <Card key={meal.menu_id}>
                <View style={styles.mealHeader}>
                  <Pill>{meal.category}</Pill>
                </View>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={styles.tagRow}>
                  {meal.tags.map((tag) => (
                    <View key={tag} style={styles.pricePill}>
                      <Text style={styles.priceText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.priceRow}>
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>
                      {t("student")} {meal.price_student.toFixed(2)} €
                    </Text>
                  </View>
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>
                      {t("staff")} {meal.price_staff.toFixed(2)} €
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
