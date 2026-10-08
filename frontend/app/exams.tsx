import Ionicons from "@react-native-vector-icons/ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { campusApi, Exam } from "@/src/api";
import {
  AppButton,
  Card,
  EmptyState,
  ErrorView,
  Field,
  LoadingView,
  ScreenHeader,
} from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { confirmAction, notify } from "@/src/utils/confirm";
import { daysUntil, formatDay } from "@/src/utils/countdown";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  countdown: {
    minWidth: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
  },
  countdownUrgent: { backgroundColor: colors.brandPrimary },
  countdownValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  countdownValueUrgent: { color: colors.onBrandPrimary },
  countdownUnit: { fontSize: 11, fontWeight: "700", color: colors.onBrandTertiary },
  countdownUnitUrgent: { color: colors.onBrandPrimary },
  title: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
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
  flex: { flex: 1 },
}));

function defaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export default function Exams() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    course: "",
    location: "",
    date: defaultDate(),
    start_time: "09:00",
  });

  const exams = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: campusApi.exams,
  });

  const createExam = useMutation({
    mutationFn: () =>
      campusApi.createExam({
        title: form.title.trim(),
        course: form.course.trim() || null,
        location: form.location.trim() || null,
        date: form.date.trim(),
        start_time: form.start_time.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setModalOpen(false);
      setForm({
        title: "",
        course: "",
        location: "",
        date: defaultDate(),
        start_time: "09:00",
      });
    },
    onError: (error) => notify(t("errorTitle"), (error as Error).message),
  });

  const removeExam = useMutation({
    mutationFn: campusApi.deleteExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
  });

  const items = exams.data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title={t("exams")}
        right={
          <TouchableOpacity
            testID="exams-add-button"
            onPress={() => setModalOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="add-circle" size={30} color={colors.brandPrimary} />
          </TouchableOpacity>
        }
      />
      {exams.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : exams.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => exams.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          {items.length === 0 ? (
            <Card>
              <EmptyState
                icon="school-outline"
                title={t("noExams")}
                hint={t("noExamsHint")}
              />
            </Card>
          ) : (
            items.map((exam) => {
              const days = daysUntil(exam.date);
              const urgent = days <= 7;
              return (
                <Card key={exam.exam_id}>
                  <View style={styles.row}>
                    <View
                      style={[styles.countdown, urgent && styles.countdownUrgent]}
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
                    <View style={styles.flex}>
                      <Text style={styles.title}>{exam.title}</Text>
                      <Text style={styles.meta}>
                        {formatDay(exam.date, lang)} · {exam.start_time}
                        {exam.location ? ` · ${exam.location}` : ""}
                      </Text>
                      {exam.course ? (
                        <Text style={styles.meta}>{exam.course}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      testID={`exams-delete-${exam.exam_id}`}
                      onPress={() =>
                        confirmAction({
                          title: exam.title,
                          message: t("deleteConfirm"),
                          confirmLabel: t("delete"),
                          cancelLabel: t("cancel"),
                          onConfirm: () => removeExam.mutate(exam.exam_id),
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
                </Card>
              );
            })
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
            <Text style={styles.modalTitle}>{t("addExam")}</Text>
            <TouchableOpacity
              testID="exams-modal-close"
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
              testID="exams-title-input"
              label={t("title")}
              value={form.title}
              onChangeText={(title) => setForm({ ...form, title })}
              placeholder="Klausur Regelungstechnik"
            />
            <Field
              testID="exams-course-input"
              label={t("course")}
              value={form.course}
              onChangeText={(course) => setForm({ ...form, course })}
              placeholder="Regelungstechnik"
            />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={styles.flex}>
                <Field
                  testID="exams-date-input"
                  label={t("examDate")}
                  value={form.date}
                  onChangeText={(date) => setForm({ ...form, date })}
                  placeholder="2026-07-01"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.flex}>
                <Field
                  testID="exams-time-input"
                  label={t("startTime")}
                  value={form.start_time}
                  onChangeText={(start_time) => setForm({ ...form, start_time })}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Field
              testID="exams-location-input"
              label={t("location")}
              value={form.location}
              onChangeText={(location) => setForm({ ...form, location })}
              placeholder="H1"
            />
            <AppButton
              testID="exams-save-button"
              label={t("save")}
              loading={createExam.isPending}
              disabled={!form.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.date)}
              onPress={() => createExam.mutate()}
            />
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}
