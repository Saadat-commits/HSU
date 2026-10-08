import Ionicons from "@react-native-vector-icons/ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
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

import { campusApi, Grade, GradesResponse } from "@/src/api";
import {
  AppButton,
  Card,
  EmptyState,
  ErrorView,
  Field,
  LoadingView,
  ScreenHeader,
  SectionTitle,
} from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { confirmAction, notify } from "@/src/utils/confirm";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.xl },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "800", color: colors.brandPrimary },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  course: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.onSurface },
  ects: { fontSize: 12, color: colors.muted },
  gradeBadge: {
    minWidth: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
  },
  gradeValue: { fontSize: 15, fontWeight: "800", color: colors.onBrandTertiary },
  divider: { height: 1, backgroundColor: colors.divider },
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
  row: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
}));

export default function Grades() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    semester: "",
    course: "",
    ects: "5",
    grade: "2.0",
  });

  const grades = useQuery<GradesResponse>({
    queryKey: ["grades"],
    queryFn: campusApi.grades,
  });

  const createGrade = useMutation({
    mutationFn: () =>
      campusApi.createGrade({
        semester: form.semester.trim(),
        course: form.course.trim(),
        ects: Number(form.ects) || 0,
        grade: Number(form.grade.replace(",", ".")) || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setModalOpen(false);
      setForm({ semester: "", course: "", ects: "5", grade: "2.0" });
    },
    onError: (error) => notify(t("errorTitle"), (error as Error).message),
  });

  const removeGrade = useMutation({
    mutationFn: campusApi.deleteGrade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grades"] }),
  });

  const bySemester = useMemo(() => {
    const groups = new Map<string, Grade[]>();
    for (const grade of grades.data?.grades ?? []) {
      const list = groups.get(grade.semester) ?? [];
      list.push(grade);
      groups.set(grade.semester, list);
    }
    return [...groups.entries()];
  }, [grades.data]);

  const confirmDelete = (grade: Grade) =>
    confirmAction({
      title: grade.course,
      message: t("deleteConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      onConfirm: () => removeGrade.mutate(grade.grade_id),
    });

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title={t("gradesTitle")}
        right={
          <TouchableOpacity
            testID="grades-add-button"
            onPress={() => setModalOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="add-circle" size={30} color={colors.brandPrimary} />
          </TouchableOpacity>
        }
      />
      {grades.isLoading ? (
        <LoadingView label={t("loading")} />
      ) : grades.isError ? (
        <ErrorView
          title={t("errorGeneric")}
          retryLabel={t("retry")}
          onRetry={() => grades.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue} testID="grades-average">
                {grades.data?.average != null
                  ? grades.data.average.toFixed(2)
                  : "–"}
              </Text>
              <Text style={styles.statLabel}>{t("gradeAverage")}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{grades.data?.total_ects ?? 0}</Text>
              <Text style={styles.statLabel}>{t("totalEcts")}</Text>
            </Card>
          </View>

          {bySemester.length === 0 ? (
            <Card>
              <EmptyState
                icon="ribbon-outline"
                title={t("noGrades")}
                hint={t("noGradesHint")}
              />
            </Card>
          ) : (
            bySemester.map(([semester, items]) => (
              <View key={semester}>
                <SectionTitle>{semester}</SectionTitle>
                <Card>
                  {items.map((grade, index) => (
                    <View key={grade.grade_id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <View style={styles.gradeRow}>
                        <View style={styles.flex}>
                          <Text style={styles.course}>{grade.course}</Text>
                          <Text style={styles.ects}>
                            {grade.ects} {t("ects")}
                          </Text>
                        </View>
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeValue}>
                            {grade.grade.toFixed(1)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          testID={`grades-delete-${grade.grade_id}`}
                          onPress={() => confirmDelete(grade)}
                          style={styles.iconButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.muted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
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
            <Text style={styles.modalTitle}>{t("addGrade")}</Text>
            <TouchableOpacity
              testID="grades-modal-close"
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
              testID="grades-semester-input"
              label={t("semester")}
              value={form.semester}
              onChangeText={(semester) => setForm({ ...form, semester })}
              placeholder="Trimester 4"
            />
            <Field
              testID="grades-course-input"
              label={t("course")}
              value={form.course}
              onChangeText={(course) => setForm({ ...form, course })}
              placeholder="Regelungstechnik"
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field
                  testID="grades-ects-input"
                  label={t("ects")}
                  value={form.ects}
                  onChangeText={(ects) => setForm({ ...form, ects })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.flex}>
                <Field
                  testID="grades-grade-input"
                  label={t("grade")}
                  value={form.grade}
                  onChangeText={(grade) => setForm({ ...form, grade })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <AppButton
              testID="grades-save-button"
              label={t("save")}
              loading={createGrade.isPending}
              disabled={!form.course.trim() || !form.semester.trim()}
              onPress={() => createGrade.mutate()}
            />
            <Pressable onPress={() => setModalOpen(false)}>
              <Text style={[styles.statLabel, { textAlign: "center" }]}>
                {t("cancel")}
              </Text>
            </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}
