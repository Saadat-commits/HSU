import Ionicons from "@react-native-vector-icons/ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import { campusApi, ScheduleEntry } from "@/src/api";
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
import { useI18n, WEEKDAYS, WEEKDAYS_LONG } from "@/src/i18n";
import { confirmAction, notify } from "@/src/utils/confirm";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const TYPES = ["Vorlesung", "Seminar", "Übung", "Projekt", "Prüfung"];

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
  dayLabelActive: { color: colors.onBrandPrimary },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    marginTop: 4,
  },
  dayDotActive: { backgroundColor: colors.onBrandPrimary },
  content: { padding: spacing.lg, gap: spacing.md },
  dayTitle: { fontSize: 18, fontWeight: "800", color: colors.onSurface },
  entryRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  timeBox: { width: 62 },
  timeText: { fontSize: 15, fontWeight: "800", color: colors.onSurface },
  timeEnd: { fontSize: 12, color: colors.muted },
  entryTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  entryMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  deleteButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modalRoot: { flex: 1, backgroundColor: colors.surface },
  modalContent: { padding: spacing.lg, gap: spacing.lg },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
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
  chipText: { fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary },
  chipTextActive: { color: colors.onBrandPrimary },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
}));

export default function Schedule() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Vorlesung",
    professor: "",
    location: "",
    start_time: "08:15",
    end_time: "09:45",
  });

  const schedule = useQuery<ScheduleEntry[]>({
    queryKey: ["schedule"],
    queryFn: campusApi.schedule,
  });

  const createEntry = useMutation({
    mutationFn: () =>
      campusApi.createSchedule({
        ...form,
        professor: form.professor || null,
        location: form.location || null,
        weekday: selectedDay,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      setModalOpen(false);
      setForm({
        title: "",
        type: "Vorlesung",
        professor: "",
        location: "",
        start_time: "08:15",
        end_time: "09:45",
      });
    },
    onError: (error) => notify(t("errorTitle"), (error as Error).message),
  });

  const removeEntry = useMutation({
    mutationFn: campusApi.deleteSchedule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const entries = schedule.data ?? [];
  const dayEntries = entries.filter((entry) => entry.weekday === selectedDay);

  const confirmDelete = (entry: ScheduleEntry) => {
    confirmAction({
      title: entry.title,
      message: t("deleteConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      onConfirm: () => removeEntry.mutate(entry.entry_id),
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title={t("schedule")}
        showBack={false}
        right={
          <TouchableOpacity
            testID="schedule-add-button"
            onPress={() => setModalOpen(true)}
            style={styles.deleteButton}
          >
            <Ionicons
              name="add-circle"
              size={30}
              color={colors.brandPrimary}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.dayRow}>
        {WEEKDAYS[lang].slice(0, 5).map((day, index) => {
          const active = index === selectedDay;
          const hasEntries = entries.some((entry) => entry.weekday === index);
          return (
            <Pressable
              key={day}
              testID={`schedule-day-${index}`}
              onPress={() => setSelectedDay(index)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {day}
              </Text>
              {hasEntries ? (
                <View style={[styles.dayDot, active && styles.dayDotActive]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {schedule.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : schedule.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => schedule.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          <Text style={styles.dayTitle}>{WEEKDAYS_LONG[lang][selectedDay]}</Text>
          {dayEntries.length === 0 ? (
            <Card>
              <EmptyState
                icon="calendar-outline"
                title={t("noEntries")}
                hint={t("noEntriesHint")}
              />
            </Card>
          ) : (
            dayEntries.map((entry) => (
              <Card key={entry.entry_id}>
                <View style={styles.entryRow}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeText}>{entry.start_time}</Text>
                    <Text style={styles.timeEnd}>{entry.end_time}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entryMeta}>
                      {[entry.location, entry.professor]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
                      <Pill>{entry.type}</Pill>
                    </View>
                  </View>
                  <TouchableOpacity
                    testID={`schedule-delete-${entry.entry_id}`}
                    onPress={() => confirmDelete(entry)}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={[styles.modalRoot, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.dayRow}>
            <Text style={[styles.dayTitle, styles.flex]}>{t("addEntry")}</Text>
            <TouchableOpacity
              testID="schedule-modal-close"
              onPress={() => setModalOpen(false)}
              style={styles.deleteButton}
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
              testID="schedule-title-input"
              label={t("title")}
              value={form.title}
              onChangeText={(title) => setForm({ ...form, title })}
              placeholder="Höhere Mathematik II"
            />
            <View>
              <Text style={styles.label}>{t("type")}</Text>
              <View style={styles.chipRow}>
                {TYPES.map((type) => {
                  const active = form.type === type;
                  return (
                    <Pressable
                      key={type}
                      testID={`schedule-type-${type.toLowerCase()}`}
                      onPress={() => setForm({ ...form, type })}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View>
              <Text style={styles.label}>{t("weekday")}</Text>
              <View style={styles.chipRow}>
                {WEEKDAYS[lang].slice(0, 5).map((day, index) => {
                  const active = selectedDay === index;
                  return (
                    <Pressable
                      key={day}
                      testID={`schedule-weekday-${index}`}
                      onPress={() => setSelectedDay(index)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field
                  testID="schedule-start-input"
                  label={t("startTime")}
                  value={form.start_time}
                  onChangeText={(start_time) => setForm({ ...form, start_time })}
                  placeholder="08:15"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.flex}>
                <Field
                  testID="schedule-end-input"
                  label={t("endTime")}
                  value={form.end_time}
                  onChangeText={(end_time) => setForm({ ...form, end_time })}
                  placeholder="09:45"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Field
              testID="schedule-professor-input"
              label={t("professor")}
              value={form.professor}
              onChangeText={(professor) => setForm({ ...form, professor })}
              placeholder="Prof. Dr. Albrecht"
            />
            <Field
              testID="schedule-location-input"
              label={t("location")}
              value={form.location}
              onChangeText={(location) => setForm({ ...form, location })}
              placeholder="H1"
            />
            <AppButton
              testID="schedule-save-button"
              label={t("save")}
              loading={createEntry.isPending}
              disabled={!form.title.trim()}
              onPress={() => createEntry.mutate()}
            />
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}
